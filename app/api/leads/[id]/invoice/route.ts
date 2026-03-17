// app/api/leads/[id]/invoice/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import {
  ensureValidToken,
  createContact,
  findContactByEmail,
  createInvoice,
  sendInvoice,
} from '@/lib/integrations/xero'

// Zod schema for invoice creation
const createInvoiceSchema = z.object({
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(0.01, 'Quantity must be positive'),
    unitAmount: z.number().min(0, 'Unit amount must be non-negative'),
    accountCode: z.string().default('200'), // 200 = Sales in Xero default chart of accounts
  })).min(1, 'At least one line item is required'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'),
  notes: z.string().optional(),
  sendEmail: z.boolean().default(true),
})

// POST /api/leads/[id]/invoice - Create a Xero invoice for a lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const supabase = createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org and role
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!userData?.organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 })
  }

  // Only owners and admins can create invoices
  if (!['owner', 'admin'].includes(userData.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Parse and validate body
  const body = await request.json()
  const validation = createInvoiceSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten(),
    }, { status: 400 })
  }

  const { items, dueDate, notes, sendEmail: shouldSend } = validation.data

  // Get the lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  // Verify the lead belongs to the user's org
  if (lead.organization_id !== userData.organization_id) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  try {
    // Get valid Xero token
    const { accessToken, tenantId } = await ensureValidToken(userData.organization_id)

    // Build contact name from lead data
    const contactName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.email || 'Unknown Contact'

    // Find or create contact in Xero
    let contactId: string

    if (lead.email) {
      // Try to find existing contact by email
      const existingContact = await findContactByEmail(accessToken, tenantId, lead.email)

      if (existingContact) {
        contactId = existingContact.ContactID
      } else {
        // Create new contact
        const newContact = await createContact(accessToken, tenantId, {
          Name: contactName,
          FirstName: lead.first_name || undefined,
          LastName: lead.last_name || undefined,
          EmailAddress: lead.email,
          ...(lead.phone ? {
            Phones: [{ PhoneType: 'DEFAULT', PhoneNumber: lead.phone }],
          } : {}),
        })
        contactId = newContact.ContactID
      }
    } else {
      // No email — create contact with name only
      const newContact = await createContact(accessToken, tenantId, {
        Name: contactName,
        FirstName: lead.first_name || undefined,
        LastName: lead.last_name || undefined,
        ...(lead.phone ? {
          Phones: [{ PhoneType: 'DEFAULT', PhoneNumber: lead.phone }],
        } : {}),
      })
      contactId = newContact.ContactID
    }

    // Create the invoice
    const lineItems = items.map(item => ({
      Description: item.description,
      Quantity: item.quantity,
      UnitAmount: item.unitAmount,
      AccountCode: item.accountCode,
    }))

    const invoice = await createInvoice(accessToken, tenantId, {
      Type: 'ACCREC',
      Contact: { ContactID: contactId },
      LineItems: lineItems,
      DueDate: dueDate,
      Reference: notes || `Lead: ${contactName}`,
      Status: shouldSend ? 'AUTHORISED' : 'DRAFT',
    })

    // Send invoice via email if requested and the invoice is authorised
    if (shouldSend && invoice.Status === 'AUTHORISED') {
      try {
        await sendInvoice(accessToken, tenantId, invoice.InvoiceID)
      } catch (sendErr) {
        console.error('Failed to send Xero invoice email:', sendErr)
        // Don't fail the whole operation if just email sending fails
      }
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.quantity * item.unitAmount), 0)

    // Update lead with invoice info
    const invoiceStatus = shouldSend ? 'sent' : 'draft'

    await supabase
      .from('leads')
      .update({
        invoice_id: invoice.InvoiceID,
        invoice_status: invoiceStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    // Log activity
    const formattedTotal = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(total)

    await supabase
      .from('lead_activities')
      .insert({
        lead_id: id,
        organization_id: lead.organization_id,
        type: 'invoice_created',
        content: `Invoice #${invoice.InvoiceNumber} created for ${formattedTotal}${shouldSend ? ' and sent' : ''}`,
        performed_by: user.id,
        metadata: {
          invoice_id: invoice.InvoiceID,
          invoice_number: invoice.InvoiceNumber,
          total,
          status: invoiceStatus,
          items: items.length,
        },
      })

    return NextResponse.json({
      invoiceId: invoice.InvoiceID,
      invoiceNumber: invoice.InvoiceNumber,
      total,
      status: invoiceStatus,
    })
  } catch (err) {
    console.error('Xero invoice creation error:', err)

    const message = err instanceof Error ? err.message : 'Failed to create invoice'

    // Check for specific Xero errors
    if (message.includes('not found or not connected')) {
      return NextResponse.json(
        { error: 'Xero is not connected. Please connect Xero in Integrations settings.' },
        { status: 400 }
      )
    }

    if (message.includes('re-authentication required')) {
      return NextResponse.json(
        { error: 'Xero session expired. Please reconnect Xero in Integrations settings.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
