import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Document type → extraction schema mapping
const EXTRACTION_SCHEMAS: Record<string, any> = {
  bank_statement: {
    name: "extract_bank_statement",
    description: "Extract structured financial data from a bank statement",
    parameters: {
      type: "object",
      properties: {
        account_holder_name: { type: "string" },
        bank_name: { type: "string" },
        account_number: { type: "string" },
        statement_period: {
          type: "object",
          properties: {
            start_date: { type: "string", description: "YYYY-MM-DD" },
            end_date: { type: "string", description: "YYYY-MM-DD" },
          },
          required: ["start_date", "end_date"],
          additionalProperties: false,
        },
        currency: { type: "string" },
        opening_balance: { type: "number" },
        closing_balance: { type: "number" },
        total_credits: { type: "number", description: "Sum of all deposits/inflows" },
        total_debits: { type: "number", description: "Sum of all withdrawals/outflows" },
        average_monthly_income: { type: "number", description: "Estimated monthly income from credits" },
        average_monthly_expenses: { type: "number", description: "Estimated monthly expenses from debits" },
        salary_deposits: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string" },
              amount: { type: "number" },
              source: { type: "string" },
            },
            required: ["date", "amount"],
            additionalProperties: false,
          },
          description: "Identified salary or regular income deposits",
        },
        recurring_obligations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              amount: { type: "number" },
              frequency: { type: "string", enum: ["monthly", "weekly", "quarterly"] },
            },
            required: ["description", "amount", "frequency"],
            additionalProperties: false,
          },
          description: "Recurring debits like loan EMIs, rent, subscriptions",
        },
        bounce_count: { type: "integer", description: "Number of bounced/returned transactions" },
        lowest_balance: { type: "number" },
        income_regularity: { type: "string", enum: ["regular", "irregular", "seasonal"], description: "How consistent is income timing" },
        confidence: { type: "number", description: "0-1 confidence in extraction quality" },
      },
      required: ["currency", "total_credits", "total_debits", "average_monthly_income", "average_monthly_expenses", "confidence"],
      additionalProperties: false,
    },
  },
  trade_license: {
    name: "extract_trade_license",
    description: "Extract structured data from a trade/business license or registration document",
    parameters: {
      type: "object",
      properties: {
        business_name: { type: "string" },
        registration_number: { type: "string" },
        registration_date: { type: "string", description: "YYYY-MM-DD" },
        expiry_date: { type: "string", description: "YYYY-MM-DD if applicable" },
        business_type: { type: "string" },
        business_activity: { type: "string", description: "Primary business activity or sector" },
        registered_address: { type: "string" },
        owner_name: { type: "string" },
        capital_amount: { type: "number", description: "Registered capital if stated" },
        capital_currency: { type: "string" },
        issuing_authority: { type: "string" },
        is_active: { type: "boolean", description: "Whether the license appears currently valid" },
        confidence: { type: "number", description: "0-1 confidence in extraction quality" },
      },
      required: ["business_name", "confidence"],
      additionalProperties: false,
    },
  },
  financial_statement: {
    name: "extract_financial_statement",
    description: "Extract structured data from financial statements, P&L, or balance sheets",
    parameters: {
      type: "object",
      properties: {
        document_type: { type: "string", enum: ["profit_loss", "balance_sheet", "cash_flow", "combined", "receipts"] },
        period: { type: "string", description: "e.g. 'FY 2025' or 'Jan-Jun 2025'" },
        currency: { type: "string" },
        total_revenue: { type: "number" },
        total_expenses: { type: "number" },
        net_profit: { type: "number" },
        total_assets: { type: "number" },
        total_liabilities: { type: "number" },
        cash_on_hand: { type: "number" },
        monthly_revenue_estimate: { type: "number" },
        profit_margin_pct: { type: "number", description: "Net profit margin as percentage" },
        confidence: { type: "number", description: "0-1 confidence in extraction quality" },
      },
      required: ["currency", "confidence"],
      additionalProperties: false,
    },
  },
  utility_bill: {
    name: "extract_utility_bill",
    description: "Extract data from a utility bill for address verification and payment patterns",
    parameters: {
      type: "object",
      properties: {
        utility_type: { type: "string", enum: ["electricity", "water", "internet", "gas", "other"] },
        provider_name: { type: "string" },
        account_holder_name: { type: "string" },
        billing_address: { type: "string" },
        bill_date: { type: "string", description: "YYYY-MM-DD" },
        amount_due: { type: "number" },
        currency: { type: "string" },
        payment_status: { type: "string", enum: ["paid", "unpaid", "overdue"] },
        confidence: { type: "number", description: "0-1 confidence in extraction quality" },
      },
      required: ["confidence"],
      additionalProperties: false,
    },
  },
  id_copy: {
    name: "extract_id_document",
    description: "Extract data from an ID document for KYC verification",
    parameters: {
      type: "object",
      properties: {
        document_type: { type: "string", enum: ["national_id", "passport", "drivers_license", "voter_id", "other"] },
        full_name: { type: "string" },
        id_number: { type: "string" },
        date_of_birth: { type: "string", description: "YYYY-MM-DD" },
        gender: { type: "string", enum: ["male", "female", "other"] },
        nationality: { type: "string" },
        expiry_date: { type: "string", description: "YYYY-MM-DD if applicable" },
        issuing_authority: { type: "string" },
        address: { type: "string" },
        confidence: { type: "number", description: "0-1 confidence in extraction quality" },
      },
      required: ["full_name", "id_number", "confidence"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    console.log("extract-document: parsing request body");
    const body = await req.json();
    const extraction_id = body?.extraction_id;
    if (!extraction_id) throw new Error("extraction_id is required, got: " + JSON.stringify(body));

    console.log("extract-document: extraction_id =", extraction_id);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!supabaseUrl || !serviceKey) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch the extraction record
    console.log("extract-document: fetching extraction record");
    const { data: extraction, error: extErr } = await supabase
      .from("document_extractions")
      .select("*")
      .eq("id", extraction_id)
      .single();

    if (extErr || !extraction) {
      console.error("extract-document: fetch error:", JSON.stringify(extErr));
      throw new Error(extErr?.message || "Extraction record not found");
    }
    console.log("extract-document: record found, doc_type =", extraction.document_type);

    // Update status to processing
    await supabase
      .from("document_extractions")
      .update({ extraction_status: "processing" })
      .eq("id", extraction_id);

    // Download the file from storage
    console.log("extract-document: downloading file from", extraction.storage_path);
    const { data: fileData, error: fileErr } = await supabase.storage
      .from("application-documents")
      .download(extraction.storage_path);

    if (fileErr || !fileData) {
      const errMsg = fileErr?.message || "File not found in storage";
      console.error("extract-document: download error:", JSON.stringify(fileErr));
      await supabase
        .from("document_extractions")
        .update({ extraction_status: "failed", error_message: errMsg })
        .eq("id", extraction_id);
      throw new Error(errMsg);
    }
    console.log("extract-document: file downloaded, size =", fileData.size);

    // Convert to base64 for AI (chunked to avoid call stack overflow)
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const chunkSize = 8192;
    let binaryStr = "";
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binaryStr += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binaryStr);
    const mimeType = fileData.type || "application/pdf";

    // Determine schema based on document type
    const docType = extraction.document_type;
    const schema = EXTRACTION_SCHEMAS[docType] || EXTRACTION_SCHEMAS["bank_statement"];

    // Call Lovable AI for extraction
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    // ── Phase 1: Document Validation ──
    // Ask AI to classify and validate the document BEFORE extraction
    console.log("extract-document: running document validation");

    const validationSchema = {
      name: "validate_document",
      description: "Validate whether the uploaded document matches the expected type and meets period requirements",
      parameters: {
        type: "object",
        properties: {
          is_valid: { type: "boolean", description: "True if the document genuinely matches the expected_type" },
          detected_type: { 
            type: "string", 
            enum: ["bank_statement", "trade_license", "financial_statement", "utility_bill", "id_copy", "receipt", "invoice", "letter", "contract", "report", "presentation", "spreadsheet", "unknown", "junk"],
            description: "What type of document this actually appears to be"
          },
          validation_reason: { type: "string", description: "Brief explanation of why the document is or isn't valid (e.g. 'This is a business proposal PDF, not a bank statement')" },
          confidence: { type: "number", description: "0-1 confidence in the classification" },
          period_start: { type: "string", description: "YYYY-MM-DD — earliest date covered by the document (for bank statements and utility bills)" },
          period_end: { type: "string", description: "YYYY-MM-DD — latest date covered by the document (for bank statements and utility bills)" },
          period_months: { type: "number", description: "Approximate number of months the document covers" },
          meets_period_requirement: { type: "boolean", description: "True if the document covers at least 3 months (required for bank_statement and utility_bill)" },
        },
        required: ["is_valid", "detected_type", "validation_reason", "confidence"],
        additionalProperties: false,
      },
    };

    const requiresPeriod = docType === "bank_statement" || docType === "utility_bill";
    const periodRule = requiresPeriod
      ? `\n\nPERIOD REQUIREMENT (CRITICAL for ${docType.replace(/_/g, " ")}):
- This document MUST cover at least 3 consecutive months of data.
- Look at the statement period, transaction dates, or billing dates to determine the time range.
- Set period_start, period_end, and period_months based on what you observe.
- Set meets_period_requirement=true ONLY if the document covers >= 3 months.
- If the document covers less than 3 months, set is_valid=false and explain that it does not meet the minimum 3-month period requirement.
- If you cannot determine the period from the document, set meets_period_requirement=false and explain why.`
      : "";

    const validationPrompt = `You are a document verification specialist. Analyze this uploaded document and determine if it genuinely is a "${docType.replace(/_/g, " ")}".

CRITICAL RULES:
- A bank_statement MUST show bank account transactions, balances, deposits, withdrawals with dates. A random financial report, proposal, or spreadsheet is NOT a bank statement.
- A utility_bill MUST be an actual bill from a utility provider (electricity, water, gas, internet) showing charges. A random document is NOT a utility bill.
- A trade_license MUST be an official government/authority document granting permission to operate a business.
- An id_copy MUST be a government-issued identification document (passport, national ID, driver's license).
- A financial_statement MUST be formal accounting documents (P&L, balance sheet, cash flow statement).

If the document does NOT match the expected type, set is_valid=false and identify what it actually is. Be strict — do not accept vaguely related documents.${periodRule}`;

    const validationResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: validationPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `Expected document type: "${docType.replace(/_/g, " ")}". Is this document valid?` },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
            ],
          },
        ],
        tools: [{ type: "function", function: validationSchema }],
        tool_choice: { type: "function", function: { name: "validate_document" } },
      }),
    });

    if (!validationResponse.ok) {
      const errStatus = validationResponse.status;
      const errText = await validationResponse.text();
      console.error("Validation AI error:", errStatus, errText);
      // If validation fails, fall through to extraction anyway
    }

    let isValid = true;
    let detectedType = docType;
    let validationReason = "";
    let periodStart: string | null = null;
    let periodEnd: string | null = null;
    let periodMonths: number | null = null;
    let meetsPeriodRequirement: boolean | null = null;

    if (validationResponse.ok) {
      const valData = await validationResponse.json();
      const valToolCall = valData.choices?.[0]?.message?.tool_calls?.[0];
      if (valToolCall) {
        const valResult = JSON.parse(valToolCall.function.arguments);
        isValid = valResult.is_valid;
        detectedType = valResult.detected_type || docType;
        validationReason = valResult.validation_reason || "";
        periodStart = valResult.period_start || null;
        periodEnd = valResult.period_end || null;
        periodMonths = valResult.period_months || null;
        meetsPeriodRequirement = valResult.meets_period_requirement ?? null;
        console.log("extract-document: validation result:", JSON.stringify(valResult));

        // Enforce 3-month period requirement for bank statements and utility bills
        const requiresPeriodCheck = docType === "bank_statement" || docType === "utility_bill";
        if (isValid && requiresPeriodCheck && meetsPeriodRequirement === false) {
          isValid = false;
          const periodInfo = periodMonths != null 
            ? `Document covers only ~${periodMonths} month(s)` 
            : "Could not determine the period covered";
          validationReason = `${periodInfo}. Bank statements and utility bills must cover at least 3 consecutive months.`;
          console.log("extract-document: PERIOD VALIDATION FAILED:", validationReason);
        }
      }
    }

    // If document is not valid, save as invalid and skip extraction
    if (!isValid) {
      console.log("extract-document: document INVALID, detected as:", detectedType);
      const invalidReason = meetsPeriodRequirement === false 
        ? `Insufficient period: ${validationReason}` 
        : `Invalid document: ${validationReason}`;
      
      await supabase
        .from("document_extractions")
        .update({
          extraction_status: "invalid",
          extracted_data: { 
            is_valid: false, 
            detected_type: detectedType, 
            validation_reason: validationReason,
            expected_type: docType,
            period_start: periodStart,
            period_end: periodEnd,
            period_months: periodMonths,
            meets_period_requirement: meetsPeriodRequirement,
          },
          confidence_score: 0,
          error_message: invalidReason,
        })
        .eq("id", extraction_id);

      return new Response(JSON.stringify({ 
        success: false, 
        is_valid: false, 
        detected_type: detectedType,
        validation_reason: validationReason,
        period_start: periodStart,
        period_end: periodEnd,
        period_months: periodMonths,
        meets_period_requirement: meetsPeriodRequirement,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Phase 2: Data Extraction (only for valid documents) ──
    console.log("extract-document: document VALID, proceeding with extraction");

    const systemPrompt = `You are a document extraction specialist for African financial documents. Extract structured data from the provided document image/PDF with high accuracy. 
Pay special attention to:
- Currency amounts (distinguish between local currency and USD)
- Dates (use YYYY-MM-DD format)
- Names and addresses
- Financial figures (income, expenses, balances)
If data is unclear or missing, omit optional fields rather than guessing. Set confidence based on document quality and extraction certainty.`;

    const userPrompt = `Extract structured data from this ${docType.replace(/_/g, " ")} document. Be thorough and accurate.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
            ],
          },
        ],
        tools: [{ type: "function", function: schema }],
        tool_choice: { type: "function", function: { name: schema.name } },
      }),
    });

    if (!aiResponse.ok) {
      const errStatus = aiResponse.status;
      const errText = await aiResponse.text();
      console.error("AI extraction error:", errStatus, errText);

      const errorMsg = errStatus === 429
        ? "Rate limited — please retry in a moment"
        : errStatus === 402
          ? "AI credits exhausted"
          : `AI extraction failed (${errStatus})`;

      await supabase
        .from("document_extractions")
        .update({ extraction_status: "failed", error_message: errorMsg })
        .eq("id", extraction_id);

      return new Response(JSON.stringify({ error: errorMsg }), {
        status: errStatus === 429 ? 429 : errStatus === 402 ? 402 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      await supabase
        .from("document_extractions")
        .update({ extraction_status: "failed", error_message: "AI did not return structured extraction" })
        .eq("id", extraction_id);
      throw new Error("AI extraction returned no structured data");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    extractedData.is_valid = true;
    extractedData.detected_type = docType;
    const confidence = extractedData.confidence || 0.5;

    // Save extraction results
    await supabase
      .from("document_extractions")
      .update({
        extraction_status: "completed",
        extracted_data: extractedData,
        confidence_score: confidence,
        error_message: null,
      })
      .eq("id", extraction_id);

    // If bank statement, auto-populate income data into application
    if (docType === "bank_statement" && extractedData.average_monthly_income) {
      const { data: appData } = await supabase
        .from("applications")
        .select("monthly_income, monthly_expenses")
        .eq("id", extraction.application_id)
        .single();

      // Only update if not already set or if OCR is more detailed
      const updates: Record<string, any> = {};
      if (!appData?.monthly_income && extractedData.average_monthly_income) {
        updates.monthly_income = extractedData.average_monthly_income;
      }
      if (!appData?.monthly_expenses && extractedData.average_monthly_expenses) {
        updates.monthly_expenses = extractedData.average_monthly_expenses;
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from("applications")
          .update(updates)
          .eq("id", extraction.application_id);
      }

      // Insert income history records from salary deposits
      if (extractedData.salary_deposits?.length > 0) {
        const incomeRecords = extractedData.salary_deposits.map((dep: any) => ({
          borrower_id: extraction.application_id, // Will need borrower_id
          institution_id: extraction.institution_id,
          income_amount: dep.amount,
          income_source: dep.source || "salary",
          period_start: dep.date,
          period_end: dep.date,
          currency: extractedData.currency || "USD",
          verified: false,
        }));

        // Get borrower_id from application
        const { data: appForBorrower } = await supabase
          .from("applications")
          .select("borrower_id")
          .eq("id", extraction.application_id)
          .single();

        if (appForBorrower?.borrower_id) {
          for (const record of incomeRecords) {
            record.borrower_id = appForBorrower.borrower_id;
          }
          await supabase.from("income_history").insert(incomeRecords);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, extracted_data: extractedData, confidence }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : (typeof e === "string" ? e : JSON.stringify(e));
    console.error("extract-document error:", errMsg, e);
    return new Response(
      JSON.stringify({ error: errMsg || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
