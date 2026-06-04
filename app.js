(function () {
  "use strict";

  /* ── Privacy: purge any PHI that may have been stored by earlier versions ── */
  try {
    ["OW_WOUND_HISTORY_V1", "OW_RERUN_WOUND_OVERRIDES_V1", "OW_HIPAA_AUDIT_LOG_V1"].forEach((k) => {
      localStorage.removeItem(k);
    });
  } catch { /* no-op if storage is blocked */ }

  const TREATMENT_CATALOG = [{"category": "Pressure Management", "treatment_option": "Repositioning schedule (e.g., q2h while bedbound)", "use_case": "Pressure injuries, high-risk immobile patients", "clinical_notes": "Core prevention/treatment intervention.", "evidence_signal": "Guideline-supported", "key_cautions": "Individualize schedule based on tolerance and skin response.", "source_reference": "NPIAP/EPUAP/PPPIA pressure injury guideline"}, {"category": "Pressure Management", "treatment_option": "Heel offloading boots / heel suspension", "use_case": "Heel pressure injuries and heel risk prevention", "clinical_notes": "Removes direct heel pressure.", "evidence_signal": "Guideline-supported", "key_cautions": "Check for device-related pressure points.", "source_reference": "NPIAP/EPUAP/PPPIA pressure injury guideline"}, {"category": "Pressure Management", "treatment_option": "Support surfaces (high-spec foam / alternating pressure mattress)", "use_case": "Moderate-high pressure injury risk or existing pressure ulcers", "clinical_notes": "Adjunct to, not replacement for repositioning.", "evidence_signal": "Guideline-supported", "key_cautions": "Ensure appropriate setup and routine skin checks.", "source_reference": "NPIAP/EPUAP/PPPIA pressure injury guideline"}, {"category": "Diabetic Foot Offloading", "treatment_option": "Non-removable knee-high offloading device (e.g., TCC/irremovable walker)", "use_case": "Neuropathic plantar forefoot/midfoot diabetic ulcers", "clinical_notes": "First-choice offloading option in guideline pathways.", "evidence_signal": "Guideline-supported", "key_cautions": "Not appropriate for every patient; monitor for balance/fall risk and skin complications.", "source_reference": "IWGDF Offloading Guideline 2023"}, {"category": "Diabetic Foot Offloading", "treatment_option": "Removable knee-high walker", "use_case": "When non-removable device is contraindicated or not tolerated", "clinical_notes": "Adherence is critical; efficacy drops with poor wear time.", "evidence_signal": "Guideline-supported", "key_cautions": "Educate patient on adherence and activity modification.", "source_reference": "IWGDF Offloading Guideline 2023"}, {"category": "Diabetic Foot Offloading", "treatment_option": "Removable ankle-high offloading device / post-op shoe", "use_case": "Alternative offloading when knee-high options unavailable/inappropriate", "clinical_notes": "Usually lower offloading effect than knee-high devices.", "evidence_signal": "Guideline-supported", "key_cautions": "Monitor healing closely; escalate if no progress.", "source_reference": "IWGDF Offloading Guideline 2023"}, {"category": "Venous Ulcer Core Care", "treatment_option": "Multilayer compression bandaging", "use_case": "Venous leg ulcers with adequate arterial perfusion", "clinical_notes": "Compression is cornerstone treatment for VLU healing.", "evidence_signal": "Moderate-strong evidence", "key_cautions": "Contraindicated in severe arterial disease; assess perfusion first.", "source_reference": "Cochrane compression review; SVS/AVF venous ulcer guideline"}, {"category": "Venous Ulcer Core Care", "treatment_option": "Compression stockings (healing/maintenance phases)", "use_case": "Healed or healing venous ulcers to reduce recurrence", "clinical_notes": "Supports healing and recurrence prevention.", "evidence_signal": "Moderate evidence", "key_cautions": "Adherence and proper fit are essential.", "source_reference": "Cochrane compression therapy reviews"}, {"category": "Venous Ulcer Adjunct", "treatment_option": "Intermittent pneumatic compression (IPC)", "use_case": "Selected venous ulcers, especially when edema control is difficult", "clinical_notes": "Adjunct in selected cases.", "evidence_signal": "Mixed evidence", "key_cautions": "Use with vascular and edema plan; not universal first-line.", "source_reference": "Cochrane IPC review"}, {"category": "Arterial / Ischemic Management", "treatment_option": "Vascular evaluation and revascularization referral", "use_case": "Arterial ulcers, ischemic findings, poor perfusion non-healing wounds", "clinical_notes": "Perfusion restoration is often prerequisite for healing.", "evidence_signal": "Guideline-supported", "key_cautions": "Debridement strategy changes when perfusion is severely impaired.", "source_reference": "SVS/IWGDF PAD-related guidance"}, {"category": "Cleansing", "treatment_option": "Normal saline irrigation", "use_case": "Routine wound cleansing across most wound types", "clinical_notes": "Neutral, broadly compatible baseline cleanser.", "evidence_signal": "Standard practice", "key_cautions": "Use adequate volume/pressure for cleansing without trauma.", "source_reference": "StatPearls wound dressing / wound irrigation"}, {"category": "Cleansing", "treatment_option": "Sterile water or potable water cleansing (selected settings)", "use_case": "Alternative when saline unavailable or per protocol", "clinical_notes": "May be acceptable depending on wound context and local policy.", "evidence_signal": "Context-dependent evidence", "key_cautions": "Use stricter sterility standards for high-risk wounds.", "source_reference": "StatPearls wound irrigation; RCTs comparing saline vs water"}, {"category": "Antiseptic / Bioburden", "treatment_option": "Dakin solution (dilute sodium hypochlorite, protocol-guided)", "use_case": "Bioburden-focused cleansing in selected infected/contaminated wounds", "clinical_notes": "Most protocols use dilute concentrations and short-duration plans.", "evidence_signal": "Mixed evidence, long clinical use", "key_cautions": "Higher concentrations may impair healing; follow dilution standards.", "source_reference": "StatPearls Dakin solution; DailyMed Santyl compatibility note"}, {"category": "Antiseptic / Bioburden", "treatment_option": "Hypochlorous acid wound cleanser", "use_case": "Low-toxicity antimicrobial cleansing strategy", "clinical_notes": "Common in modern wound protocols for bioburden control.", "evidence_signal": "Emerging-moderate", "key_cautions": "Use product-specific IFU and facility policy.", "source_reference": "Wound management literature and product IFUs"}, {"category": "Antiseptic / Bioburden", "treatment_option": "Acetic acid (typically 0.25-1%) for suspected Pseudomonas burden", "use_case": "Selected wounds with suspected/confirmed Pseudomonas, protocol-driven", "clinical_notes": "Used in some centers as targeted topical antiseptic strategy.", "evidence_signal": "Limited-moderate", "key_cautions": "Concentration and exposure must be protocolized to avoid tissue injury.", "source_reference": "Prospective RCT and reviews in chronic wounds"}, {"category": "Debridement", "treatment_option": "Sharp / surgical debridement", "use_case": "Necrotic tissue, high slough burden, infected devitalized tissue", "clinical_notes": "Fastest route for definitive devitalized tissue removal.", "evidence_signal": "Guideline-supported", "key_cautions": "Requires trained provider; bleeding/perfusion risks must be assessed.", "source_reference": "Wound Debridement StatPearls; WHS pressure ulcer guidance"}, {"category": "Debridement", "treatment_option": "Conservative sharp debridement", "use_case": "Frequent bedside maintenance debridement in chronic wounds", "clinical_notes": "Often paired with moisture/bioburden management plan.", "evidence_signal": "Guideline-supported", "key_cautions": "Scope-of-practice and competency requirements apply.", "source_reference": "WHS guideline concepts; debridement literature"}, {"category": "Debridement", "treatment_option": "Mechanical debridement (wet-to-dry, irrigation-assisted, etc.)", "use_case": "Moderate-large necrotic burden when selective methods are not feasible", "clinical_notes": "Non-selective and may remove viable tissue.", "evidence_signal": "Traditional method", "key_cautions": "Pain and tissue trauma risk; use selectively.", "source_reference": "Wound Debridement StatPearls"}, {"category": "Debridement", "treatment_option": "Autolytic debridement", "use_case": "Non-urgent devitalized tissue in moist wound environment", "clinical_notes": "Selective and gentler, but slower than sharp methods.", "evidence_signal": "Standard supportive method", "key_cautions": "If no progress, switch or add another method promptly.", "source_reference": "Wound Debridement StatPearls"}, {"category": "Debridement", "treatment_option": "Enzymatic debridement (Santyl / collagenase)", "use_case": "Selective debridement in chronic ulcers with devitalized collagenous tissue", "clinical_notes": "Useful between sharp debridements or when sharp debridement limited.", "evidence_signal": "Label-supported therapy", "key_cautions": "Heavy metal ions (including some silver antiseptics) may reduce activity; cleanse/rinse per label.", "source_reference": "DailyMed Santyl label"}, {"category": "Debridement", "treatment_option": "Biologic debridement (sterile larval therapy)", "use_case": "Selected chronic wounds needing selective necrotic tissue removal", "clinical_notes": "Can be effective when other methods are limited.", "evidence_signal": "Specialized evidence", "key_cautions": "Patient tolerance and wound location considerations apply.", "source_reference": "Wound Debridement StatPearls"}, {"category": "Device-Based Debridement", "treatment_option": "XSONX wound hygiene/debridement system", "use_case": "Cleansing and debridement of chronic and acute wounds under clinician direction", "clinical_notes": "Device IFU includes use cases and contraindications.", "evidence_signal": "Device-indication supported", "key_cautions": "Use by trained professionals; respect contraindications (e.g., malignancy, high-risk vascular contexts).", "source_reference": "XSONX IFU"}, {"category": "Device-Based Debridement", "treatment_option": "Arobella Qoustic wound therapy system", "use_case": "Ultrasound-assisted contact/non-contact debridement and wound-bed prep", "clinical_notes": "Includes irrigation/lavage and debridement workflows.", "evidence_signal": "Device-indication supported", "key_cautions": "Use by trained clinicians per IFU and facility policy.", "source_reference": "Arobella QWTS brochure / FDA-cleared indication references"}, {"category": "Moisture Balance Dressings", "treatment_option": "Foam dressing (standard or silicone border)", "use_case": "Moderate exudate, pressure injury protection/cushioning", "clinical_notes": "Common default for many pressure injuries.", "evidence_signal": "Common standard care", "key_cautions": "Monitor saturation and periwound maceration.", "source_reference": "StatPearls wound dressings; guideline practice"}, {"category": "Moisture Balance Dressings", "treatment_option": "Hydrocolloid dressing", "use_case": "Low-moderate exudate wounds without overt infection", "clinical_notes": "Occlusive moist environment support.", "evidence_signal": "Common standard care", "key_cautions": "Avoid in heavily exudative or overtly infected wounds unless protocolized.", "source_reference": "StatPearls wound dressings"}, {"category": "Moisture Balance Dressings", "treatment_option": "Hydrogel (sheet/gel)", "use_case": "Dry wounds or dry devitalized tissue needing moisture donation", "clinical_notes": "Facilitates autolytic debridement and hydration.", "evidence_signal": "Common standard care", "key_cautions": "Not ideal for high exudate wounds.", "source_reference": "StatPearls wound dressings"}, {"category": "Moisture Balance Dressings", "treatment_option": "Transparent film dressing", "use_case": "Superficial low-exudate wounds or secondary cover", "clinical_notes": "Allows visualization and gas exchange.", "evidence_signal": "Common standard care", "key_cautions": "Not for heavily draining wounds.", "source_reference": "StatPearls wound dressings"}, {"category": "Moisture Balance Dressings", "treatment_option": "Gauze packing / ribbon", "use_case": "Cavitary wounds and tunnels when packing is needed", "clinical_notes": "Widely available but less moisture retentive.", "evidence_signal": "Traditional method", "key_cautions": "Avoid desiccation and retained packing; count strips.", "source_reference": "StatPearls wound dressings"}, {"category": "High Exudate Management", "treatment_option": "Calcium alginate dressing", "use_case": "Moderate-heavy exudate wounds, including cavity wounds", "clinical_notes": "Forms gel and supports moist balance with absorption.", "evidence_signal": "Common standard care", "key_cautions": "Needs secondary dressing; avoid very dry wounds.", "source_reference": "ConvaTec/Kaltostat and related alginate IFU indications"}, {"category": "High Exudate Management", "treatment_option": "Hydrofiber dressing (non-silver)", "use_case": "Moderate-heavy exudate with close wound-bed contact", "clinical_notes": "Converts to gel to manage fluid.", "evidence_signal": "Common standard care", "key_cautions": "Monitor for saturation/roll-over and change appropriately.", "source_reference": "Hydrofiber product IFUs"}, {"category": "High Exudate Management", "treatment_option": "Superabsorbent polymer dressing", "use_case": "Very high exudate and periwound maceration risk", "clinical_notes": "Useful as secondary absorbent cover.", "evidence_signal": "Practice-based", "key_cautions": "Frequent reassessment needed in heavily draining wounds.", "source_reference": "Advanced dressing practice references"}, {"category": "Antimicrobial Dressings", "treatment_option": "Silver dressing (foam, hydrofiber, alginate, etc.)", "use_case": "Wounds with local infection signs or high bioburden risk", "clinical_notes": "Use as a time-limited antimicrobial trial with reassessment.", "evidence_signal": "Mixed evidence across wound types", "key_cautions": "Avoid indefinite routine use; confirm compatibility with other topicals (e.g., collagenase workflow).", "source_reference": "ConvaTec Aquacel Ag IFUs; Cochrane silver reviews"}, {"category": "Antimicrobial Dressings", "treatment_option": "Hydrofera Blue (methylene blue/gentian violet foam)", "use_case": "Bioburden-focused local wound management with absorptive foam", "clinical_notes": "Requires hydration/secondary dressing per product type.", "evidence_signal": "Device/product indication supported", "key_cautions": "Not indicated for third-degree burns; follow IFU for prep and secondary cover.", "source_reference": "Hydrofera Blue Classic IFU"}, {"category": "Antimicrobial Dressings", "treatment_option": "Iodine-based dressings (cadexomer iodine / povidone-iodine products)", "use_case": "Selected bioburden or infected wound contexts", "clinical_notes": "Alternative antimicrobial option in many formularies.", "evidence_signal": "Mixed evidence", "key_cautions": "Screen for iodine sensitivity/thyroid concerns as applicable.", "source_reference": "Wound dressing evidence reviews and product IFUs"}, {"category": "Autolytic / Osmotic", "treatment_option": "MediHoney gel/paste/sheets/alginate variants", "use_case": "Sloughy wounds, autolytic debridement support, selected chronic wounds", "clinical_notes": "Can help autolytic debridement and may increase early exudate.", "evidence_signal": "Mixed evidence with product-specific support", "key_cautions": "Monitor for stinging and moisture balance; contraindicated in known honey sensitivity.", "source_reference": "MediHoney debridement brochure and application guide"}, {"category": "Matrix / Tissue Support", "treatment_option": "Collagen dressing", "use_case": "Clean granulating but stalled wounds", "clinical_notes": "Matrix support commonly used in chronic wound pathways.", "evidence_signal": "Moderate specialized evidence", "key_cautions": "Best after adequate debridement and bioburden control.", "source_reference": "Collagen matrix literature and product IFUs"}, {"category": "Matrix / Tissue Support", "treatment_option": "Collagen + ORC matrix (with or without silver)", "use_case": "Protease-heavy stalled chronic wounds", "clinical_notes": "Often selected after repeated failure of basic dressings.", "evidence_signal": "Specialized RCT/meta-analysis support", "key_cautions": "Avoid use over necrotic tissue unless directed by IFU and specialist.", "source_reference": "3M Promogran/Prisma product monographs"}, {"category": "Negative Pressure", "treatment_option": "Negative pressure wound therapy (NPWT)", "use_case": "Deep wounds, high exudate, post-debridement cavity management, graft/flap prep", "clinical_notes": "Widely used; evidence varies by wound type.", "evidence_signal": "Mixed evidence by indication", "key_cautions": "Ensure bleeding risk and exposed structure contraindications are addressed.", "source_reference": "Cochrane NPWT reviews; WHS guideline references"}, {"category": "Negative Pressure", "treatment_option": "NPWT with instillation (NPWTi-d)", "use_case": "Selected contaminated/complex wounds requiring cyclic instillation", "clinical_notes": "Advanced wound-center workflow in selected patients.", "evidence_signal": "Emerging evidence", "key_cautions": "Requires protocolized specialist management.", "source_reference": "WHS 2023 guideline discussion; recent reviews"}, {"category": "Adjunctive Oxygen", "treatment_option": "Hyperbaric oxygen therapy (HBOT)", "use_case": "Selected refractory ischemic/neuro-ischemic diabetic foot ulcers", "clinical_notes": "Adjunct where standard care alone fails and resources exist.", "evidence_signal": "Mixed evidence, selective recommendation", "key_cautions": "Not first-line for most wounds; screen for contraindications and logistical feasibility.", "source_reference": "IWGDF wound-healing guideline 2023; Cochrane HBOT review"}, {"category": "Adjunctive Oxygen", "treatment_option": "Topical oxygen therapy", "use_case": "Selected refractory diabetic foot ulcers where resources exist", "clinical_notes": "Adjunctive option in some guideline pathways.", "evidence_signal": "Emerging evidence", "key_cautions": "Use in specialized programs with defined criteria.", "source_reference": "IWGDF wound-healing guideline 2023"}, {"category": "Infection Management", "treatment_option": "Culture-guided topical/systemic antimicrobial plan", "use_case": "Clinically infected wounds or high suspicion for deeper infection", "clinical_notes": "Treat infection based on depth/severity and likely pathogens.", "evidence_signal": "Guideline-supported", "key_cautions": "Do not rely on topical-only therapy for systemic/deep infection.", "source_reference": "WHS guideline; IDSA/IWGDF diabetic foot infection guidance"}, {"category": "Infection Management", "treatment_option": "Osteomyelitis workup and management pathway", "use_case": "Deep chronic wounds with exposed/probable bone involvement", "clinical_notes": "Requires imaging/labs and often multidisciplinary input.", "evidence_signal": "Guideline-supported", "key_cautions": "Delayed diagnosis can lead to major morbidity/amputation.", "source_reference": "Diabetic foot infection guideline frameworks"}, {"category": "Surgical Reconstruction", "treatment_option": "Flap closure / surgical reconstruction", "use_case": "Selected stage 3/4 pressure injuries and complex defects after optimization", "clinical_notes": "Consider after infection control, debridement, perfusion and pressure plan.", "evidence_signal": "Specialist pathway", "key_cautions": "High recurrence risk without strict offloading and risk-factor control.", "source_reference": "WHS pressure ulcer guideline"}, {"category": "Grafting / Cellular Products", "treatment_option": "Cellular/tissue-based products (CTPs, skin substitutes)", "use_case": "Refractory chronic ulcers after standard care optimization", "clinical_notes": "Broad class including cellular and acellular products.", "evidence_signal": "Product-specific evidence variability", "key_cautions": "Coverage and selection are highly policy/product specific.", "source_reference": "CMS CTP coverage policy context; product labeling"}, {"category": "Grafting / Cellular Products", "treatment_option": "Split-thickness skin grafting", "use_case": "Prepared wound beds when closure acceleration is needed", "clinical_notes": "Requires optimized bed (debrided, perfused, infection-controlled).", "evidence_signal": "Established surgical approach", "key_cautions": "Donor-site morbidity and graft take factors must be managed.", "source_reference": "Surgical wound reconstruction standards"}, {"category": "Hemostasis / Bleeding", "treatment_option": "Alginate-based hemostatic packing", "use_case": "Minor capillary oozing with exudative wounds", "clinical_notes": "Some alginates provide hemostatic support while absorbing fluid.", "evidence_signal": "Product-indication support", "key_cautions": "Not for uncontrolled arterial bleeding.", "source_reference": "Calcium alginate dressing IFUs"}, {"category": "Periwound Skin Protection", "treatment_option": "Skin barrier film / barrier ointment", "use_case": "Periwound maceration risk with exudate-heavy wounds", "clinical_notes": "Protects surrounding skin and reduces adhesive injury.", "evidence_signal": "Standard supportive care", "key_cautions": "Reapply based on manufacturer wear-time guidance.", "source_reference": "Wound care best-practice references"}, {"category": "Periwound Skin Protection", "treatment_option": "Silicone contact layer", "use_case": "Fragile skin and pain-sensitive wound beds", "clinical_notes": "Atraumatic interface under absorptive secondary dressings.", "evidence_signal": "Standard supportive care", "key_cautions": "Ensure exudate can pass through to secondary absorbent layer.", "source_reference": "Dressing class guidance"}, {"category": "Pain Management", "treatment_option": "Pre-medication before dressing changes/debridement", "use_case": "Painful wounds or procedures limiting adherence", "clinical_notes": "Improves tolerance of essential wound interventions.", "evidence_signal": "Clinical best practice", "key_cautions": "Coordinate with overall medication safety plan.", "source_reference": "Wound-care procedural best practices"}, {"category": "Pain Management", "treatment_option": "Topical anesthetic support for debridement sessions", "use_case": "Selected painful bedside debridement", "clinical_notes": "May improve patient acceptance of frequent debridement.", "evidence_signal": "Practice-based", "key_cautions": "Use within prescriber order and local policy.", "source_reference": "Device IFUs and procedural guidance"}, {"category": "Nutrition / Systemic Optimization", "treatment_option": "Nutrition optimization (protein-energy, micronutrients as indicated)", "use_case": "Chronic wounds, malnutrition risk, delayed healing", "clinical_notes": "Systemic support strongly influences local wound outcomes.", "evidence_signal": "Guideline-supported", "key_cautions": "Individualize by renal/hepatic status and dietitian input.", "source_reference": "WHS guideline supportive care principles"}, {"category": "Nutrition / Systemic Optimization", "treatment_option": "Glycemic optimization pathway", "use_case": "Diabetes-related wounds", "clinical_notes": "Improves overall healing potential and infection outcomes.", "evidence_signal": "Guideline-supported", "key_cautions": "Coordinate with diabetes management team.", "source_reference": "IWGDF practical guidelines"}, {"category": "Lifestyle / Risk Reduction", "treatment_option": "Smoking and nicotine cessation support", "use_case": "All chronic non-healing wounds in active tobacco/nicotine users", "clinical_notes": "Improves perfusion and healing biology.", "evidence_signal": "Broad medical evidence", "key_cautions": "Provide formal cessation resources where possible.", "source_reference": "General wound-healing physiology literature"}, {"category": "Lifestyle / Risk Reduction", "treatment_option": "Mobility and edema plan (PT/OT, elevation, calf pump activation)", "use_case": "Venous edema, immobility-related healing barriers", "clinical_notes": "Reduces edema and secondary pressure/shear risk.", "evidence_signal": "Supportive clinical evidence", "key_cautions": "Tailor plan to fall risk and cardiovascular status.", "source_reference": "Venous ulcer and pressure injury care frameworks"}, {"category": "Special Clinical Caveats", "treatment_option": "Stable dry heel eschar conservative pathway", "use_case": "Dry, stable, noninfected heel eschar in selected patients", "clinical_notes": "Debridement may be deferred in specific guideline contexts.", "evidence_signal": "Guideline caveat", "key_cautions": "Monitor closely for infection/inflammation changes; reassess perfusion.", "source_reference": "WHS 2023 and NPIAP pressure injury guidance"}, {"category": "Special Clinical Caveats", "treatment_option": "Treating fungal burden/moisture-associated skin damage alongside wound care", "use_case": "Periwound fungal dermatitis/intertrigo or moisture injury", "clinical_notes": "Addressing surrounding skin often improves wound healing trajectory.", "evidence_signal": "Best-practice supportive care", "key_cautions": "Avoid prolonged occlusion that worsens moisture damage.", "source_reference": "Wound/skin integrity best-practice resources"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Short-stretch compression systems (including Unna-type pathways)", "use_case": "Venous ulcers with edema where multilayer strategy is tailored by clinician and perfusion status", "clinical_notes": "Alternative compression architecture in selected venous pathways.", "evidence_signal": "Moderate evidence for compression as a class", "key_cautions": "Confirm arterial perfusion before compression; monitor for pressure injury from wrap technique.", "source_reference": "Cochrane compression reviews; SVS/AVF venous ulcer guideline"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Venous duplex + early endovenous ablation referral", "use_case": "Active or recurrent venous ulcers with superficial reflux", "clinical_notes": "Procedural venous care can improve healing trajectory and recurrence outcomes in selected patients.", "evidence_signal": "Moderate-specialized evidence", "key_cautions": "Requires vascular specialist workup and procedural candidacy assessment.", "source_reference": "EVRA trial and related venous ulcer evidence syntheses (PubMed)"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Felted foam plus therapeutic footwear/offloading modifications", "use_case": "Selected diabetic foot ulcers when device offloading pathways are being adapted", "clinical_notes": "Can supplement pressure redistribution when full device options are not feasible.", "evidence_signal": "Guideline-recognized adjunct", "key_cautions": "May be less effective than gold-standard non-removable knee-high options.", "source_reference": "IWGDF offloading guideline 2023"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Pulse lavage / irrigation-assisted wound cleansing", "use_case": "High debris burden or contaminated wounds requiring mechanical irrigation support", "clinical_notes": "Used to improve mechanical cleansing during wound bed preparation.", "evidence_signal": "Practice-based evidence", "key_cautions": "Aerosolization/infection-control precautions and tissue trauma risk must be managed.", "source_reference": "Wound debridement/irrigation procedural references"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "PHMB-containing antimicrobial cleansers/dressings", "use_case": "Local bioburden management where formulary supports PHMB products", "clinical_notes": "Common antimicrobial class in some formularies.", "evidence_signal": "Mixed evidence with product-level variation", "key_cautions": "Use as time-limited antimicrobial strategy with regular reassessment.", "source_reference": "Advanced wound product IFUs and evidence reviews"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Hydrosurgical debridement systems", "use_case": "Operative/procedural wound bed preparation requiring rapid selective tissue removal", "clinical_notes": "Used in selected surgical and advanced wound center workflows.", "evidence_signal": "Specialized procedural evidence", "key_cautions": "Requires trained operators and procedural setting.", "source_reference": "Debridement modality reviews and surgical practice literature"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Low-frequency ultrasound adjunctive wound therapy", "use_case": "Selected chronic wounds in specialist programs", "clinical_notes": "Adjunctive modality sometimes used for wound bed stimulation.", "evidence_signal": "Low to mixed certainty by indication", "key_cautions": "Evidence heterogeneity is high; avoid replacing core standard-of-care measures.", "source_reference": "Cochrane therapeutic ultrasound reviews"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Activated charcoal odor-control secondary dressings", "use_case": "Malodorous wounds where odor reduction supports quality of life and care adherence", "clinical_notes": "Supportive option to reduce odor burden while core treatment continues.", "evidence_signal": "Practice-based supportive evidence", "key_cautions": "Odor control does not replace infection/debridement evaluation.", "source_reference": "Wound supportive-care references and product IFUs"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Sucrose octasulfate-impregnated dressing", "use_case": "Selected non-infected neuro-ischemic diabetic foot ulcers not improving despite optimized standard care", "clinical_notes": "Guideline-supported adjunct for narrowly defined diabetic foot scenarios.", "evidence_signal": "Guideline conditional recommendation", "key_cautions": "Use only with best standard care, including offloading and infection exclusion.", "source_reference": "IWGDF wound healing guideline 2023 recommendation set"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Autologous platelet-rich plasma or platelet-derived topical pathway", "use_case": "Refractory chronic wounds under specialist supervision", "clinical_notes": "Biologic adjunct considered in selected advanced wound programs.", "evidence_signal": "Emerging, product/process-specific evidence", "key_cautions": "Protocol quality and preparation method strongly influence outcomes.", "source_reference": "Advanced chronic wound systematic reviews"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Placental/amniotic membrane allograft pathway", "use_case": "Non-healing chronic ulcers after optimization of debridement, perfusion, offloading/compression, and infection control", "clinical_notes": "Subset of cellular/tissue products with product-specific evidence.", "evidence_signal": "Variable product-level evidence", "key_cautions": "Coverage criteria and documentation requirements are often strict.", "source_reference": "CTP evidence reviews and payer policy frameworks"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Electrical stimulation adjunctive therapy", "use_case": "Selected chronic pressure and neuropathic wounds in rehabilitation or specialist settings", "clinical_notes": "Has been studied as adjunctive stimulation for wound healing biology.", "evidence_signal": "Low-moderate, mixed evidence", "key_cautions": "Use only with trained staff and clear protocol; not a replacement for pressure/offloading core care.", "source_reference": "WHS 2023 cited RCT literature and wound rehab studies"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Topical antiseptic rotation protocol (time-limited)", "use_case": "Persistent bioburden concerns where one antimicrobial strategy appears to be failing", "clinical_notes": "Some teams rotate antiseptics short-term while reassessing infection, debridement adequacy, and moisture balance.", "evidence_signal": "Practice-based, low-certainty", "key_cautions": "Avoid prolonged empiric cycling without objective reassessment or culture-guided plan when indicated.", "source_reference": "Specialist wound-center protocols and infection-control principles"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Escalated edema pathway (lymphedema therapy, wrapping strategy optimization)", "use_case": "Venous/lymphatic edema blocking closure despite local wound care", "clinical_notes": "Edema control is often rate-limiting for closure in lower-extremity wounds.", "evidence_signal": "Supportive evidence", "key_cautions": "Coordinate with vascular, cardiac, and mobility risk considerations.", "source_reference": "Venous ulcer best-practice frameworks"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Debridement cadence protocol (scheduled serial debridement)", "use_case": "Chronic wounds with recurrent slough burden", "clinical_notes": "Predefined cadence can improve consistency of wound bed preparation.", "evidence_signal": "Guideline-aligned practice", "key_cautions": "Cadence must adjust to perfusion, pain, bleeding risk, and bedside response.", "source_reference": "WHS debridement principles"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Periwound adhesive-injury prevention kit (silicone tapes/removers/protectants)", "use_case": "Fragile skin, recurrent skin tears, dressing-change trauma", "clinical_notes": "Reduces secondary injury and can improve tolerance of frequent dressing changes.", "evidence_signal": "Best-practice supportive care", "key_cautions": "Ensure compatibility with primary/secondary dressing adherence needs.", "source_reference": "Skin integrity and MARSI prevention resources"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Silver-to-non-silver de-escalation checkpoint", "use_case": "Wounds that received antimicrobial dressings and now show reduced bioburden signs", "clinical_notes": "Encourages planned antimicrobial stewardship in local wound care.", "evidence_signal": "Stewardship best practice", "key_cautions": "Do not continue antimicrobial dressings indefinitely without objective need.", "source_reference": "Antimicrobial dressing stewardship discussions in evidence reviews"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "NPWT bridge pathway to graft/flap closure", "use_case": "Complex defects where temporary granulation and fluid control are needed before definitive closure", "clinical_notes": "Common staged reconstruction workflow.", "evidence_signal": "Established specialist practice", "key_cautions": "Requires close surgical planning and strict pressure/offloading continuation.", "source_reference": "WHS reconstruction principles; NPWT specialist practice"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Palliative wound-care comfort pathway", "use_case": "Goals-of-care prioritize comfort, odor, drainage control, and minimal procedure burden", "clinical_notes": "Shifts objective from closure-only to patient-centered comfort outcomes when appropriate.", "evidence_signal": "Guideline-recognized care model", "key_cautions": "Requires clear goals-of-care documentation and family/team communication.", "source_reference": "WHS 2023 palliative pressure-ulcer care section"}, {"category": "Diabetic Foot Offloading", "treatment_option": "Total contact cast (TCC) \u2014 gold standard for neuropathic plantar DFU", "use_case": "Active neuropathic plantar forefoot/midfoot diabetic ulcers without infection or significant ischemia", "clinical_notes": "TCC provides the highest offloading efficacy of any device in RCTs (consistently superior to removable walkers) and forces 24-hour compliance. IWGDF 2023 Grade A recommendation as first-line for neuropathic plantar DFU. The non-removable feature is the mechanism of benefit.", "evidence_signal": "Grade A \u2014 multiple RCTs; IWGDF 2023 first-line", "key_cautions": "Contraindicated with active infection, gangrene, frail skin, or poor balance/fall risk. Requires skilled casting; skin check at 1 week then every 1-2 weeks.", "source_reference": "Bus SA et al. IWGDF Offloading Guideline 2023; Armstrong DG et al. Diabetes Care 2001; Piaggesi A et al. Diabetes Care 2003; Caravaggi C et al. Diabetes Care 2000"}, {"category": "Venous Ulcer Adjunct", "treatment_option": "Pentoxifylline (oral 400mg TID) as adjunct to compression for VLUs", "use_case": "Venous leg ulcers not healing adequately with compression alone; adjunct to standard compression therapy", "clinical_notes": "Cochrane meta-analysis demonstrates pentoxifylline plus compression is more effective than compression plus placebo, and pentoxifylline alone is more effective than placebo. Number needed to treat ~6. Mechanism: improves microcirculatory flow, reduces fibrin cuff formation, and decreases leukocyte adhesion.", "evidence_signal": "Grade A \u2014 Cochrane meta-analysis (Jull et al. 2012)", "key_cautions": "GI side effects (nausea, dyspepsia); contraindicated with recent MI, cerebral hemorrhage, or intolerance to methylxanthines; prescriber decision; monitor renal function.", "source_reference": "Jull AB et al. Cochrane Database Syst Rev 2012 (PMID: 22972038); Falanga V et al. Dermatol Surg 1999; Dale JJ et al. BMJ 1999"}, {"category": "Venous Ulcer Core Care", "treatment_option": "Zinc oxide paste bandage (Unna boot) with outer elastic layer", "use_case": "Venous leg ulcers in ambulatory patients; alternative or adjunct when multilayer bandaging is limited", "clinical_notes": "Semi-rigid compression provides sustained inelastic compression that activates the calf muscle pump during ambulation. The zinc oxide provides mild astringent and antimicrobial benefit to the periwound skin. Often applied with an outer elastic bandage for two-component effect.", "evidence_signal": "Established practice; moderate evidence within compression class", "key_cautions": "Confirm adequate arterial perfusion before application (ABI \u22650.8); check weekly for edema reduction and potential tightening; not suitable for heavily exudative wounds without outer absorptive layer.", "source_reference": "O'Meara S et al. Cochrane compression review 2012; Palfreyman SJ et al. Cochrane 2007; Grey JE et al. BMJ 2006"}, {"category": "Antiseptic / Bioburden", "treatment_option": "Cadexomer iodine dressing (Iodosorb) for infected or critically colonized VLUs/chronic wounds", "use_case": "Critically colonized or locally infected chronic wounds, particularly venous leg ulcers; biofilm disruption adjunct", "clinical_notes": "Cadexomer iodine beads/ointment release iodine slowly as exudate is absorbed, providing sustained antimicrobial activity with concurrent debridement of slough. Cochrane review supports efficacy for infected VLUs vs. standard care. Distinct from povidone-iodine in mechanism and safety profile.", "evidence_signal": "Cochrane review supports use in infected VLUs; moderate-strong evidence", "key_cautions": "Screen for iodine sensitivity and thyroid disease; contraindicated in pregnancy; limit use on large wounds due to systemic absorption risk; not for dry wounds.", "source_reference": "O'Meara S et al. Cochrane 2014 (PMID: 24771721); Sibbald RG et al. Wound Care Canada 2017; Smith & Nephew Iodosorb product monograph"}, {"category": "Antiseptic / Bioburden", "treatment_option": "Betaine/PHMB wound cleanser (e.g., Prontosan irrigation solution) for biofilm disruption", "use_case": "Chronic stalled wounds with suspected or confirmed biofilm; wound bed preparation prior to advanced therapies", "clinical_notes": "Betaine (a surfactant) loosens devitalized tissue and disrupts the extracellular polymeric substance of biofilm; PHMB provides broad-spectrum antimicrobial activity. Several clinical studies show improved wound bed preparation vs. saline alone. Used as irrigation or gel.", "evidence_signal": "Moderate clinical evidence; incorporated into biofilm consensus documents", "key_cautions": "Not for deep body cavities or in conjunction with certain antiseptics; follow IFU; mechanical debridement should accompany biofilm disruption protocols.", "source_reference": "Cutting KF et al. J Wound Care 2010; Romanelli M et al. Wound Repair Regen 2010; EWMA/WUWHS Biofilm Consensus 2016; Prontosan IFU (B. Braun)"}, {"category": "Debridement", "treatment_option": "Wound bed scrubbing / mechanical biofilm disruption at each dressing change", "use_case": "Chronic wounds with suspected biofilm, recurrent surface infection signs, or failure to progress despite apparent wound bed", "clinical_notes": "Mechanical disruption of the wound surface with gauze, scrubbing pad, or monofilament fiber pad breaks up biofilm structure at each change. Must be combined with an appropriate antimicrobial cleanser post-scrubbing. Foundational step in the TIMERS biofilm management framework.", "evidence_signal": "Emerging-strong consensus; incorporated into IWGDF and WUWHS frameworks", "key_cautions": "Should be performed by trained providers; can cause transient bleeding; always follow with antimicrobial cleanser rinse; not a substitute for formal debridement when necrotic tissue present.", "source_reference": "Murphy C et al. J Wound Care 2020; Schultz G et al. Wound Repair Regen 2017; WUWHS Consensus on Wound Infection and Biofilm 2016; TIMERS framework"}, {"category": "Periwound Skin Protection", "treatment_option": "Moisture-associated skin damage (MASD/IAD) barrier regimen", "use_case": "Incontinence-associated dermatitis (IAD), periwound maceration, intertriginous dermatitis, or peristomal moisture injury", "clinical_notes": "MASD requires a structured cleanse-protect-restore approach distinct from wound dressing management. pH-balanced cleansers preserve acid mantle; high-TEWL barriers (zinc oxide, dimethicone, cyanoacrylate film) protect from moisture/chemical injury. Structured skin care reduces IAD incidence by >50% in RCTs.", "evidence_signal": "Strong RCT evidence for structured skin care regimens", "key_cautions": "Differentiate MASD/IAD from pressure injury \u2014 staging criteria differ; avoid thick occlusive barriers on infected or broken skin; address continence management in parallel.", "source_reference": "Beeckman D et al. J Wound Care 2015; Bliss DZ et al. J Wound Ostomy Continence Nurs 2017; Black JM et al. J Wound Ostomy Continence Nurs 2011; IAET MASD Consensus 2015"}, {"category": "Moisture Balance Dressings", "treatment_option": "Soft silicone foam dressing (e.g., Mepilex Border) for pressure injury prevention and fragile skin", "use_case": "High-risk bony prominences (sacrum, heel, trochanter) for PI prevention; fragile peri-wound skin; post-surgical wounds", "clinical_notes": "Soft silicone adhesive minimizes trauma at dressing change and reduces shear/friction at skin-surface interface. SENATOR RCT and subsequent studies demonstrate significant PI incidence reduction vs. standard care on sacrum and heel. Evidence is strongest for prevention on critically ill and elderly patients.", "evidence_signal": "Strong RCT evidence for PI prevention (SENATOR, BORDER trials)", "key_cautions": "For prevention use, apply prophylactically to at-risk bony prominences; not suitable as sole coverage for heavy exudate without absorptive secondary; change when saturated or soiled.", "source_reference": "Santamaria N et al. Int Wound J 2015 (SENATOR trial); Kalowes P et al. Crit Care Nurse 2016; Gefen A et al. Int Wound J 2017"}, {"category": "Moisture Balance Dressings", "treatment_option": "Atraumatic non-adherent contact layer (e.g., Mepitel One, Adaptic Touch)", "use_case": "Partial-thickness wounds, skin graft donor/recipient sites, painful wounds, superficial burns, granulating wound beds", "clinical_notes": "Soft silicone or lipidocolloid contact layers allow atraumatic dressing changes by preventing adherence to the wound bed while allowing exudate passage to an absorptive secondary layer. Essential for protecting fragile new tissue, graft sites, and reducing pain-related non-adherence to dressing changes.", "evidence_signal": "Good RCT evidence for pain reduction and graft protection", "key_cautions": "Must be paired with appropriate absorptive secondary dressing; change secondary while leaving contact layer undisturbed unless soiled; check IFU for frequency guidance.", "source_reference": "Meaume S et al. J Wound Care 2004; Gottrup F et al. Int Wound J 2013; Mepitel One IFU (Molnlycke)"}, {"category": "Nutrition / Systemic Optimization", "treatment_option": "Arginine-enriched oral nutritional supplement (e.g., ArginAid, Juven) for Stage 3/4 PI and large complex wounds", "use_case": "Pressure injuries Stage 3 or 4; large chronic wounds; patients with nutritional deficit and poor healing trajectory", "clinical_notes": "Arginine is conditionally essential during wound stress; tissue repair depletes arginine supply. RCTs show arginine-enriched supplements improve Stage 3/4 PI healing rates. NPUAP/EPUAP/PPPIA 2019 guidelines recommend consideration when wound healing is the goal and patient can tolerate.", "evidence_signal": "Moderate RCT evidence for pressure injuries; NPUAP 2019 guideline recommendation", "key_cautions": "Use alongside overall nutrition optimization, not as a substitute; renal function monitoring if impaired; dietitian involvement recommended; not to exceed directed dosing.", "source_reference": "van Anholt RD et al. Clin Nutr 2010; Cereda E et al. J Wound Care 2009; NPUAP/EPUAP/PPPIA International Pressure Injury Guidelines 2019; ESPEN guidelines on clinical nutrition"}, {"category": "Nutrition / Systemic Optimization", "treatment_option": "Micronutrient repletion (Zinc, Vitamin C, Vitamin D) for deficiency-associated healing impairment", "use_case": "Chronic non-healing wounds in patients with documented or clinically suspected micronutrient deficiency", "clinical_notes": "Zinc is an essential cofactor for metalloproteinases and collagen synthesis; Vitamin C is required for hydroxylation steps in collagen cross-linking; Vitamin D deficiency is prevalent and associated with impaired wound healing. Correct deficiencies where confirmed or suspected.", "evidence_signal": "Guideline-supported for deficiency correction; evidence for routine supplementation without deficiency is weak", "key_cautions": "Routine supplementation without evidence of deficiency is not recommended; check serum levels when feasible; zinc excess can impair copper absorption; Vitamin C in high doses may cause GI upset.", "source_reference": "Stechmiller JK. Nutr Clin Pract 2010; Posthauer ME. Adv Wound Care 2012; Bikle DD. J Endocrinol 2018; NPUAP/EPUAP/PPPIA 2019"}, {"category": "Pain Management", "treatment_option": "EMLA cream (topical lidocaine/prilocaine) before sharp debridement of leg ulcers", "use_case": "Pain management before planned sharp debridement of venous or other painful leg ulcers", "clinical_notes": "Applied under occlusion 60-90 minutes before procedure. RCT evidence demonstrates significant pain reduction during sharp debridement of venous leg ulcers. Improves patient tolerance and acceptance of more aggressive debridement.", "evidence_signal": "RCT evidence for VLU debridement pain reduction", "key_cautions": "Do not apply to mucous membranes or infected/denuded periwound skin; methemoglobinemia risk with large quantities or in patients with G6PD deficiency; prescriber decision required.", "source_reference": "Lok C et al. J Am Acad Dermatol 1999; Briggs M & Torra i Bou JE. Wound Care 2002; EMLA prescribing information"}, {"category": "Pain Management", "treatment_option": "Ibuprofen-releasing foam dressing (e.g., Biatain Ibu) for persistent wound pain", "use_case": "Painful chronic venous leg ulcers or other painful wounds where background wound pain limits quality of life", "clinical_notes": "Local ibuprofen delivery from the foam dressing reduces wound pain scores without significant systemic absorption. Multiple RCTs show reduction in daily pain vs. standard foam in VLU patients.", "evidence_signal": "Multiple RCTs for VLU background pain reduction", "key_cautions": "Not suitable for infected wounds without concurrent antimicrobial management; contraindicated in known NSAID sensitivity; monitor for local reaction; not a substitute for systemic analgesia when systemic infection is present.", "source_reference": "Gottrup F et al. J Wound Care 2007; Sibbald RG et al. Int Wound J 2012; Cochrane review on dressings for venous leg ulcers"}, {"category": "Infection Management", "treatment_option": "Levine technique wound culture (10-second rotating swab over 1cm2 under moderate pressure)", "use_case": "Clinically infected wounds or high-suspicion wounds requiring culture-guided antibiotic therapy", "clinical_notes": "The Levine technique (10-second culture swab rotating with moderate pressure over a 1 cm2 wound area) yields superior results to a simple surface swab by sampling subsurface bacteria. Tissue biopsy remains the gold standard. Culture should be preceded by wound cleansing to reduce surface contaminants.", "evidence_signal": "Guideline-recommended technique for wound cultures", "key_cautions": "Surface swab alone reflects colonization; always correlate culture with clinical infection signs; treat only clinically infected wounds \u2014 positive cultures without clinical infection do not require systemic antibiotics.", "source_reference": "Levine NS et al. Am J Clin Pathol 1976; Gardner SE et al. Wound Repair Regen 2006; IDSA Diabetic Foot Infection Guidelines 2023"}, {"category": "Infection Management", "treatment_option": "Systemic antibiotic therapy graded by infection severity (mild/moderate/severe per IDSA/IWGDF classification)", "use_case": "Clinically infected wounds with cellulitis extension, systemic signs, deep tissue involvement, or osteomyelitis concern", "clinical_notes": "IDSA/IWGDF classify DFI as mild (superficial, local only), moderate (deeper tissues, no systemic signs), and severe (systemic inflammatory response). Mild DFI may be managed with oral antibiotics; moderate/severe require broad-spectrum IV therapy and often hospitalization. All categories benefit from culture-guided de-escalation.", "evidence_signal": "Guideline-supported (IDSA 2023, IWGDF 2023)", "key_cautions": "Do not prescribe antibiotics for colonized, clinically uninfected wounds. Always obtain cultures before starting antibiotics when feasible. De-escalate based on culture and clinical response.", "source_reference": "Lipsky BA et al. IDSA/IWGDF Diabetic Foot Infection Guidelines 2023; Wounds International Wound Infection Institute Consensus 2022; IWGDF Infection Guideline 2023"}, {"category": "Pressure Management", "treatment_option": "Skin microclimate management (temperature and moisture control at skin-support surface interface)", "use_case": "High-risk patients on support surfaces, especially critically ill and those with PI Stage 1/2; device-related pressure injury prevention", "clinical_notes": "Elevated skin temperature increases metabolic demand and reduces tissue tolerance to pressure; excess moisture at the skin-support surface interface increases friction and skin maceration risk. Advanced support surfaces and moisture-wicking covers with active microclimate control reduce PI incidence. Microclimate management is specifically addressed in NPUAP/EPUAP/PPPIA 2019.", "evidence_signal": "NPUAP/EPUAP/PPPIA 2019 recommendation; emerging evidence from clinical studies", "key_cautions": "Not a substitute for repositioning; moisture-wicking overlays must be compatible with the underlying support surface; assess and document skin microclimate as part of PI risk assessment.", "source_reference": "NPUAP/EPUAP/PPPIA International Pressure Injury Guidelines 2019; Gefen A et al. J Tissue Viability 2017; Sanada H et al. Adv Wound Care 2011"}, {"category": "Special Clinical Caveats", "treatment_option": "Pyoderma gangrenosum: DO NOT DEBRIDE \u2014 pathergy-risk wound requiring immunosuppressive management", "use_case": "Ulcers with clinical features or biopsy-confirmed pyoderma gangrenosum (PG)", "clinical_notes": "CRITICAL: PG is an autoinflammatory neutrophilic dermatosis where surgical or sharp debridement causes pathergy \u2014 a paradoxical rapid worsening of the wound due to the inflammatory response to trauma. Primary management is immunosuppressive: topical/intralesional/systemic corticosteroids, cyclosporine, biologic agents (anti-TNF). Dermatology/rheumatology must be involved in management.", "evidence_signal": "Strong clinical consensus; expert guideline-supported", "key_cautions": "CRITICAL SAFETY: Do not debride any wound suspected to be PG without specialist confirmation. Even biopsy can cause pathergy \u2014 coordinate with dermatology. Misdiagnosis is common and sharp debridement frequently worsens PG.", "source_reference": "Maverakis E et al. JAMA Dermatol 2020; Callen JP & Jackson JM. Dermatol Clin 2007; Miller J et al. Dermatol Clin 2011; Brooklyn T et al. Gut 2006"}, {"category": "Special Clinical Caveats", "treatment_option": "Hypergranulation (proud flesh) management: silver nitrate application, foam pressure dressing, or topical corticosteroid", "use_case": "Wounds where hypergranulation tissue projects above wound edges, blocking epithelial migration and wound closure", "clinical_notes": "Hypergranulation can result from infection, dressing occlusion, excess moisture, or suture/device irritation. Chemical cauterization with silver nitrate sticks, firm non-adherent foam compression, or short-course topical steroid under dressing can reduce hypergranulation tissue. Address the underlying cause simultaneously.", "evidence_signal": "Clinical case series and practice consensus", "key_cautions": "Apply silver nitrate precisely to granulation tissue only, protecting periwound skin with petroleum jelly; corticosteroid should be used short-term only; reassess at 1-2 weeks; correct the causative factor (infection, occlusion, irritation).", "source_reference": "Percival NJ. Classification of Wounds. Br J Nurs 2002; Harris A & Rolstad BS. Ostomy Wound Manage 1994; Dealey C. The Care of Wounds: A Guide for Nurses 2012"}, {"category": "Special Clinical Caveats", "treatment_option": "Burns (partial/full thickness) \u2014 cooling, non-adherent dressing, and specialist referral pathway", "use_case": "Thermal, chemical, or electrical burns requiring initial wound management and triage for specialist referral", "clinical_notes": "Immediate care: cool with running water 15-20 minutes (not ice); cover with sterile non-adherent dressing (e.g., Mepitel One, Jelonet) to prevent heat loss and contamination; assess depth (superficial/deep partial, full thickness) and TBSA%. Burns requiring referral to burn center: >5% TBSA, all full-thickness, face/hands/feet/genitals/joints, chemical/electrical, inhalation injury, circumferential limb burns, inadequate social support.", "evidence_signal": "International burns guidelines; ISBI Practice Guidelines 2016", "key_cautions": "NEVER use ice (worsens injury); silver sulfadiazine not recommended for facial burns or superficial burns; major burns require multidisciplinary burn center management; assess for inhalation injury.", "source_reference": "ISBI Practice Guidelines for Burn Care 2016; European Burns Association guidelines 2017; American Burn Association guidelines; Monstrey S et al. Burns 2008"}, {"category": "Special Clinical Caveats", "treatment_option": "Radiation-induced wound / osteoradionecrosis: conservative approach with HBO consideration", "use_case": "Wounds in previously irradiated tissue fields; post-radiation skin breakdown; osteoradionecrosis", "clinical_notes": "Radiation-impaired tissue has progressive obliterative endarteritis resulting in chronic hypoxia, reduced fibroblast activity, and poor healing capacity. Management: protective dressings, gentle moisture balance, no aggressive debridement without specialist planning. Hyperbaric oxygen has evidence for soft tissue and bone radiation necrosis.", "evidence_signal": "Moderate specialized evidence; Cochrane support for HBO in radiation wounds", "key_cautions": "Avoid aggressive debridement; surgical intervention requires specialist coordination with radiation oncology; refer all radiation wounds with healing delay for specialty assessment.", "source_reference": "Marx RE. J Oral Maxillofac Surg 1983; Feldmeier JJ et al. Cochrane 2012 (HBOT for radiation); NCCN radiation dermatitis guidelines"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Becaplermin gel (PDGF-BB / Regranex) for non-healing neuropathic diabetic foot ulcers", "use_case": "Full-thickness, non-infected, non-ischemic neuropathic diabetic foot ulcers that have not responded to 8+ weeks of standard care", "clinical_notes": "Recombinant platelet-derived growth factor BB (becaplermin) promotes granulation tissue formation and fibroblast recruitment. FDA-approved specifically for neuropathic DFU. RCTs demonstrate ~30% improvement in complete wound closure vs. placebo gel when combined with good wound care and offloading.", "evidence_signal": "RCT evidence; FDA-approved indication", "key_cautions": "FDA black box warning: patients receiving \u22653 tubes have increased malignancy risk. Apply only to clean, well-debrided wounds without infection. Prescriber decision; high cost; coverage requirements vary. Do not use on ischemic wounds.", "source_reference": "Wieman TJ et al. Diabetes Care 1998; Steed DL et al. J Am Coll Surg 1995; FDA labeling for Regranex (becaplermin); Bhansali A et al. Diabetes Technol Ther 2009"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Photobiomodulation / low-level laser therapy (LLLT) as chronic wound adjunct", "use_case": "Stalled chronic wounds in specialist programs where standard care (debridement, moisture balance, offloading/compression) has been optimized", "clinical_notes": "LLLT at specific wavelengths (typically 630-830nm) is proposed to stimulate cellular metabolism, fibroblast proliferation, and growth factor production. Systematic reviews and Cochrane analysis suggest benefit over sham for some chronic wound types, but certainty is low-moderate due to heterogeneous protocols.", "evidence_signal": "Low to moderate certainty; Cochrane review suggests benefit but heterogeneous", "key_cautions": "Not a replacement for wound care fundamentals; requires trained operator and FDA/CE-cleared device; avoid on malignant wounds; protocol (wavelength, dose, frequency) significantly affects outcomes.", "source_reference": "Peplow PV et al. Lasers Med Sci 2010; Feitosa MCR et al. Wound Repair Regen 2015; Cochrane review on LLLT for chronic wounds; WALT dosage guidelines"}, {"category": "Extended Options (Formulary-Dependent)", "treatment_option": "Dehydrated human amnion/chorion membrane (dHACM) for DFU/VLU after standard care failure", "use_case": "Stalled diabetic foot ulcers or venous leg ulcers after 4+ weeks of appropriate standard care (offloading + compression + moist wound care)", "clinical_notes": "dHACM (e.g., EpiFix, Apligraf, Theraskin) delivers growth factors, extracellular matrix components, and anti-inflammatory cytokines. Multiple RCTs demonstrate improved closure rates in DFU and VLU vs. standard care alone. Medicare and commercial coverage criteria typically require 4+ weeks of documented standard care failure.", "evidence_signal": "Multiple RCTs; FDA clearance/licensure", "key_cautions": "Wound must be clean, debrided, and infection-free before application; strict patient selection and documentation required for coverage; significant cost implications; continued offloading/compression is mandatory.", "source_reference": "Zelen CM et al. J Wound Care 2014; Snyder RJ et al. Wounds 2016; Tettelbach W et al. Int Wound J 2019; CMS LCD for skin substitutes"}, {"category": "Radiation Wound Care", "treatment_option": "Non-perfumed emollient (Aquaphor, DermaVeen) \u2014 radiation dermatitis skin care", "use_case": "Acute radiation dermatitis CTCAE Grade 1-2, radiation skin care throughout treatment", "clinical_notes": "MASCC/ISOO systematic review supports emollient TID to reduce Grade 2+ dermatitis incidence. Preserves skin barrier during radiotherapy.", "evidence_signal": "Guideline-supported (MASCC 2020)", "key_cautions": "Non-perfumed products only; do not apply immediately before radiation treatment; avoid aluminum-containing antiperspirants in the treatment field.", "source_reference": "MASCC/ISOO Radiation Dermatitis Consensus Guidelines 2020"}, {"category": "Radiation Wound Care", "treatment_option": "Pentoxifylline 400mg TID + Vitamin E 1000 IU/day \u2014 radiation fibrosis and ORN adjunct", "use_case": "Chronic radiation soft tissue necrosis, osteoradionecrosis (ORN), radiation-induced fibrosis", "clinical_notes": "RCT evidence (Delanian 2003; Lefaix 1999) for combined pentoxifylline + vitamin E reducing radiation fibrosis. PENTOCLO protocol adds clodronate for bone involvement.", "evidence_signal": "RCT-supported", "key_cautions": "Prescriber decision; contraindicated with recent MI or stroke; monitor CBC and renal function; take with food; 3-12 month course.", "source_reference": "Delanian S et al. J Clin Oncol 2003; Lefaix JL et al. Lancet 1999"}, {"category": "Inflammatory Wound Management", "treatment_option": "Intralesional triamcinolone acetonide (10 mg/mL) \u2014 HS nodules and PG inflammatory lesions", "use_case": "Hidradenitis suppurativa Hurley I-II acute nodules, pyoderma gangrenosum papules", "clinical_notes": "Rapid pain control and nodule regression within 48-72 hours. Cochrane review supports intralesional steroids for HS nodules. Superior to I&D for non-fluctuant lesions.", "evidence_signal": "Cochrane-supported", "key_cautions": "Max 3 mL per session; inject into nodule body, not skin surface; 10 mg/mL preferred; limit injection frequency to avoid atrophy.", "source_reference": "Cochrane HS management; AAD HS Guidelines"}, {"category": "Inflammatory Wound Management", "treatment_option": "Topical clindamycin 1% solution \u2014 hidradenitis suppurativa Hurley I-II", "use_case": "Hidradenitis suppurativa Hurley Stage I and early Stage II", "clinical_notes": "First-line topical for mild HS. Reduces surface Staphylococcus aureus and anaerobe burden and inflammatory cytokines at lesion sites. RCT shows non-inferiority to oral tetracycline.", "evidence_signal": "RCT-supported", "key_cautions": "Apply BID to affected skin fold areas; avoid occlusion; limit to 3-month courses to reduce resistance; not monotherapy for Hurley II-III.", "source_reference": "Jemec GBE et al. Dermatology 1998 (clindamycin vs tetracycline RCT)"}, {"category": "Inflammatory Wound Management", "treatment_option": "Chlorhexidine 0.05% wound irrigation \u2014 HS sinus tracts and inflammatory wounds", "use_case": "Hidradenitis suppurativa draining sinus tracts, autoinflammatory wound management", "clinical_notes": "Dilute chlorhexidine reduces surface bacterial load without significant cytotoxicity. Used for gentle cleansing of HS draining tracts at dressing changes.", "evidence_signal": "Clinical practice", "key_cautions": "0.05% concentration only \u2014 higher concentrations are cytotoxic; do not use on exposed cartilage or bone; default to normal saline for routine wound irrigation.", "source_reference": "Clinical practice wound care standards"}, {"category": "Nutrition / Systemic Optimization", "treatment_option": "Zinc gluconate 90mg/day \u2014 hidradenitis suppurativa anti-inflammatory adjunct", "use_case": "Hidradenitis suppurativa (all Hurley stages as adjunct)", "clinical_notes": "Small RCT (Brocard 2007) shows zinc gluconate reduces HS lesion count. Anti-inflammatory and anti-androgenic mechanism. Modest but additive effect with other treatments.", "evidence_signal": "Small RCT (Brocard 2007)", "key_cautions": "Take with food to reduce nausea; avoid long-term doses >40mg elemental zinc without monitoring; not monotherapy for Hurley II-III.", "source_reference": "Brocard A et al. Zinc gluconate for hidradenitis suppurativa. Dermatology 2007"}, {"category": "Wound Closure / Dehiscence", "treatment_option": "Wound closure strips / skin closure tape \u2014 superficial wound edge approximation", "use_case": "Superficial or partial wound dehiscence, small clean lacerations, post-deroofing closure support", "clinical_notes": "Non-invasive wound edge approximation for superficial dehiscence. Reduces wound edge tension, supports healing, and bridges partial dehiscence without suture re-insertion.", "evidence_signal": "Clinical practice standard", "key_cautions": "Not for infected, contaminated, or deep wounds; requires dry intact peri-wound skin for adhesion; not for high-tension areas or deep dehiscence.", "source_reference": "Wound closure clinical standard"}, {"category": "Wound Closure / Dehiscence", "treatment_option": "Secondary closure (delayed primary / re-suture) for sterile surgical dehiscence", "use_case": "Sterile surgical wound dehiscence without fascial involvement, after granulation bed is established", "clinical_notes": "Delayed primary closure at 4-5 days once clean granulating base is established. Reduces time to healing vs secondary intention for linear dehiscences without infection.", "evidence_signal": "Surgical standard of care", "key_cautions": "Confirm absence of deep infection with CT before closure; ensure fascial integrity is maintained; do not close over infected tissue.", "source_reference": "IDSA SSI Guidelines; surgical standard"}, {"category": "Graft / Donor Site Care", "treatment_option": "Hydrocolloid dressing for STSG donor site \u2014 first 3-7 days", "use_case": "Split-thickness skin graft (STSG) donor site wound management", "clinical_notes": "Cochrane meta-analysis: hydrocolloid achieves faster healing and better pain scores than petrolatum gauze for donor sites. Allows less-frequent changes (every 3-7 days).", "evidence_signal": "Cochrane meta-analysis", "key_cautions": "Leave first dressing in place until soaking through (Day 3-5); do not remove early \u2014 disrupts forming neoepithelialization; silver-impregnated for infection risk.", "source_reference": "Cochrane: Dressings for donor site wounds (2013)"}, {"category": "Graft / Donor Site Care", "treatment_option": "Bolster / tie-over pressure dressing \u2014 STSG recipient site immobilization", "use_case": "Split-thickness skin graft recipient site, first 5-7 post-operative days", "clinical_notes": "Prevents graft shear during plasmatic imbibition and inosculation (first 48-96 hours). Even pressure eliminates dead space and prevents seroma/hematoma formation under the graft.", "evidence_signal": "Surgical standard of care", "key_cautions": "Applied in OR at time of grafting; check graft edges at Day 3-5 for take assessment; do not remove early; soak with saline for 10 min before first removal.", "source_reference": "Surgical STSG management standard"}, {"category": "Special Clinical Caveats", "treatment_option": "Hidradenitis suppurativa: Hurley-staged management \u2014 do not debride sinus tracts aggressively", "use_case": "Hidradenitis suppurativa (all Hurley stages)", "clinical_notes": "HS is autoinflammatory, not primarily infectious. Aggressive debridement triggers disease exacerbation. Deroofing in controlled setting is appropriate for individual tracts (Hurley II). Wide excision for Hurley III.", "evidence_signal": "Guideline-supported (AAD)", "key_cautions": "Hurley I: topical/intralesional. Hurley II: systemic antibiotics + biologic. Hurley III: wide excision referral. Adalimumab is the only FDA-approved biologic.", "source_reference": "AAD Hidradenitis Suppurativa Management Guidelines"}, {"category": "Special Clinical Caveats", "treatment_option": "Martorell ulcer (HILU): BP < 130/80 mmHg first, no compression, CCB therapy", "use_case": "Martorell hypertensive ischemic leg ulcer (HILU)", "clinical_notes": "HILU is driven by arteriolar calcification from hypertension \u2014 BP control is the only disease-modifying intervention. Compression is absolutely contraindicated. CCB has specific vasodilatory benefit beyond general BP control.", "evidence_signal": "Case series / retrospective cohort", "key_cautions": "ABI may be falsely normal (Monckeberg calcification); use toe-brachial index (TBI); severe pain requires mandatory structured analgesia; HBOT as adjunct after BP optimized.", "source_reference": "Hafner J et al. Dermatology 2010; Tawfick W et al. EJVES 2013"}, {"category": "Special Clinical Caveats", "treatment_option": "Vasculitic ulcer: systemic immunosuppression required \u2014 no compression \u2014 punch biopsy of wound edge", "use_case": "Vasculitic ulcer (ANCA-associated, cryoglobulinemic, leukocytoclastic vasculitis)", "clinical_notes": "Wound healing impossible without systemic disease control. Compression may worsen ischemic damage in inflamed vessels. Punch biopsy (not base, but erythematous border) required for direct immunofluorescence and histopathology.", "evidence_signal": "RAVE trial; EULAR vasculitis guidelines", "key_cautions": "Urgent rheumatology referral; ANCA, ANA, complement, hepatitis serology panel; do NOT start immunosuppression before biopsy; check urinalysis and creatinine immediately.", "source_reference": "RAVE Trial NEJM 2010; EULAR vasculitis management guidelines"}, {"category": "Special Clinical Caveats", "treatment_option": "Surgical wound dehiscence: infection status drives management \u2014 fascial dehiscence is surgical emergency", "use_case": "Surgical wound / post-operative dehiscence (all types)", "clinical_notes": "Superficial SSI: open + antibiotics. Deep/organ-space SSI: IV antibiotics + operative debridement. Fascial dehiscence with evisceration: emergent OR. NPWT for deep infected wounds after debridement.", "evidence_signal": "IDSA SSI guidelines", "key_cautions": "Do NOT close over infected wound. Fascial evisceration: moist sterile cover and call surgery STAT. Culture before starting antibiotics. CT if deep infection suspected.", "source_reference": "IDSA Surgical Site Infection Guidelines 2022"}, {"category": "Special Clinical Caveats", "treatment_option": "Osteomyelitis: MRI then bone biopsy before antibiotics \u2014 6-week targeted therapy \u2014 surgical debridement of necrotic bone", "use_case": "Osteomyelitis / exposed bone (all sites)", "clinical_notes": "MRI: sensitivity 90%, specificity 83% \u2014 modality of choice. Bone biopsy: gold standard for culture-guided therapy. 6 weeks post-debridement antibiotics per IDSA. OVIVA trial: oral non-inferior to IV for susceptible organisms.", "evidence_signal": "IDSA osteomyelitis guidelines; OVIVA trial (NEJM 2019)", "key_cautions": "Do not start antibiotics before biopsy if surgery planned. Rifampin never as monotherapy. ID consultation essential. Surgical debridement of all sequestra required for cure.", "source_reference": "IDSA Osteomyelitis Guidelines; Li HK et al. OVIVA trial, NEJM 2019"}, {"category": "Special Clinical Caveats", "treatment_option": "Graft wound: site-and-status-specific care (donor site vs. recipient site, intact vs. failed graft)", "use_case": "STSG donor site, STSG recipient site (intact, partial failure, full failure)", "clinical_notes": "Donor: hydrocolloid/alginate superior to petrolatum gauze. Recipient intact: immobilize 5-7 days, assess graft take at Day 3-5. Failed: identify cause (hematoma/infection/shear), NPWT for bed preparation, albumin >3.0 before re-grafting.", "evidence_signal": "Cochrane donor site review; surgical standard", "key_cautions": "Never forcibly remove first dressing from graft site. Assess albumin before re-grafting. Bolster dressing prevents shear.", "source_reference": "Cochrane dressing for donor site wounds 2013; STSG surgical standard"}];
  const CLINICAL_SOURCES = [{"title": "Core Guidelines", "items": [{"label": "WHS Guidelines for the Treatment of Pressure Ulcers (2023 update)", "url": "https://pubmed.ncbi.nlm.nih.gov/37970711/"}, {"label": "NPIAP/EPUAP/PPPIA pressure injury guideline hub (2019)", "url": "https://epuap.org/pu-guideline/"}, {"label": "IWGDF Offloading Guideline (2023)", "url": "https://iwgdfguidelines.org/wp-content/uploads/2023/07/IWGDF-2023-06-Offloading-Guideline.pdf"}, {"label": "IWGDF Wound Healing Interventions Guideline (2023)", "url": "https://iwgdfguidelines.org/wp-content/uploads/2023/07/IWGDF-2023-07-Wound-Healing-Guideline.pdf"}, {"label": "IWGDF/IDSA Diabetes-Related Foot Infection Guideline page (2023)", "url": "https://www.idsociety.org/practice-guideline/diabetic-foot-infections/"}, {"label": "SVS/AVF Venous Leg Ulcer Guideline (PubMed record)", "url": "https://pubmed.ncbi.nlm.nih.gov/24974070/"}]}, {"title": "Product Labels / IFUs", "items": [{"label": "DailyMed Santyl label", "url": "https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=6b6fbfc6-98fa-46aa-88ef-ab00fbb08ffd"}, {"label": "XSONX IFU", "url": "https://xsonx.com/wp-content/uploads/2023/06/230607-XSONX-WOUND-HYGIENE-SYSTEM-IFU-Instructions-For-Use.pdf"}, {"label": "Arobella Qoustic Wound Therapy System brochure/indications", "url": "https://arobella.com/wp-content/uploads/2024/12/0000334-Rev-J-04DEC2024-AR1000-QWTS-Brochure-Arobella-Medical.pdf"}, {"label": "Hydrofera Blue Classic IFU", "url": "https://staging.hydrofera.com/content/uploads/2024/12/08-004-208-Hydrofera-Blue-Classic-IFU-Rev04.pdf"}, {"label": "MediHoney debridement brochure", "url": "https://app.sales.integralife.com/advanced-wound-care/prepare/medihoney/brochures-sell-sheets/medihoney-debridement-brochure.pdf"}, {"label": "ConvaTec Aquacel Ag+ product instructions", "url": "https://www.convatec.com/en-gb/advanced-wound-care/resources/product-instructions/aquacel-ag-dressings/"}, {"label": "ConvaTec Kaltostat page with pack insert access", "url": "https://www.convatec.com/en-nz/products/advanced-wound-care/wound-type/pc-wound-pressure-ulcers-stage-1-2/kaltostat-alginate-calcium-sodium-dressing"}, {"label": "3M Promogran matrix monograph", "url": "https://multimedia.3m.com/mws/media/1897899O/3m-promogran-matrix-family-monograph.pdf"}]}, {"title": "Evidence Reviews", "items": [{"label": "Cochrane: compression bandages/stockings for venous leg ulcers", "url": "https://www.cochrane.org/CD000265/WOUNDS_compression-bandages-and-stockings-to-help-the-healing-of-venous-leg-ulcers"}, {"label": "Cochrane: compression versus no compression (venous leg ulcers)", "url": "https://www.cochrane.org/evidence/CD013397_compression-bandages-or-stockings-versus-no-compression-treating-venous-leg-ulcers"}, {"label": "EVRA trial (early endovenous ablation) PubMed", "url": "https://pubmed.ncbi.nlm.nih.gov/31140402/"}, {"label": "Cochrane: NPWT for pressure ulcers", "url": "https://www.cochrane.org/CD011334/WOUNDS_negative-pressure-wound-therapy-treating-pressure-ulcers"}, {"label": "Cochrane: silver for infected wounds", "url": "https://www.cochrane.org/CD005486/WOUNDS_topical-silver-for-treating-infected-wounds"}, {"label": "Cochrane: honey as topical wound treatment", "url": "https://www.cochrane.org/CD005083/WOUNDS_honey-as-a-topical-treatment-for-acute-and-chronic-wounds"}, {"label": "Cochrane: alginate dressings for pressure ulcers", "url": "https://www.cochrane.org/evidence/CD011277_astfadh-az-pansmanhay-alzhynat-dr-drman-zkhmhay-fshary"}, {"label": "Cochrane: hyperbaric oxygen for chronic wounds", "url": "https://www.cochrane.org/evidence/CD004123_hyperbaric-oxygen-therapy-treating-chronic-wounds"}, {"label": "Cochrane: electrical stimulation for pressure ulcers", "url": "https://www.cochrane.org/evidence/CD012196_electrical-stimulation-effective-treating-pressure-ulcers"}, {"label": "Cochrane: therapeutic ultrasound for venous leg ulcers", "url": "https://www.cochrane.org/CD001180/WOUNDS_can-ultrasound-therapy-help-heal-venous-varicose-leg-ulcers-andor-improve-symptoms"}]}, {"title": "Supplemental Clinical References", "items": [{"label": "StatPearls Wound Dressings", "url": "https://www.ncbi.nlm.nih.gov/books/NBK470199/"}, {"label": "StatPearls Wound Debridement", "url": "https://www.ncbi.nlm.nih.gov/books/NBK507882/"}, {"label": "StatPearls Dakin Solution", "url": "https://www.ncbi.nlm.nih.gov/books/NBK507916/"}, {"label": "StatPearls Wound Irrigation", "url": "https://www.ncbi.nlm.nih.gov/books/NBK538522/"}, {"label": "1% acetic acid RCT in chronic wounds with Pseudomonas", "url": "https://pubmed.ncbi.nlm.nih.gov/25851059/"}]}, {"title": "Expanded Clinical References (2024 Update)", "items": [{"label": "IWGDF Offloading Guideline 2023 — TCC Grade A recommendation", "url": "https://iwgdfguidelines.org/wp-content/uploads/2023/07/IWGDF-2023-06-Offloading-Guideline.pdf"}, {"label": "Jull AB et al. Pentoxifylline for venous leg ulcers — Cochrane 2012 (PMID: 22972038)", "url": "https://pubmed.ncbi.nlm.nih.gov/22972038/"}, {"label": "IDSA/IWGDF Diabetic Foot Infection Guidelines 2023", "url": "https://www.idsociety.org/practice-guideline/diabetic-foot-infections/"}, {"label": "O'Meara S et al. Cadexomer iodine for chronic wounds — Cochrane 2014 (PMID: 24771721)", "url": "https://pubmed.ncbi.nlm.nih.gov/24771721/"}, {"label": "Santamaria N et al. SENATOR Trial — silicone foam for PI prevention (Int Wound J 2015)", "url": "https://pubmed.ncbi.nlm.nih.gov/26333657/"}, {"label": "van Anholt RD et al. Arginine supplement for Stage 3/4 PI (Clin Nutr 2010)", "url": "https://pubmed.ncbi.nlm.nih.gov/20045569/"}, {"label": "Beeckman D et al. Structured skin care for IAD prevention (J Wound Care 2015)", "url": "https://pubmed.ncbi.nlm.nih.gov/26606512/"}, {"label": "Murphy C et al. Biofilm and wound healing — TIMERS framework (J Wound Care 2020)", "url": "https://pubmed.ncbi.nlm.nih.gov/32069139/"}, {"label": "Maverakis E et al. Pyoderma gangrenosum diagnostic criteria (JAMA Dermatol 2020)", "url": "https://pubmed.ncbi.nlm.nih.gov/32459330/"}, {"label": "Wieman TJ et al. Becaplermin for DFU (Diabetes Care 1998)", "url": "https://pubmed.ncbi.nlm.nih.gov/9571335/"}, {"label": "Lok C et al. EMLA for VLU debridement pain (J Am Acad Dermatol 1999)", "url": "https://pubmed.ncbi.nlm.nih.gov/10069514/"}, {"label": "Gottrup F et al. Ibuprofen-releasing foam dressing for wound pain (J Wound Care 2007)", "url": "https://pubmed.ncbi.nlm.nih.gov/17661787/"}, {"label": "NPUAP/EPUAP/PPPIA International Pressure Injury Guidelines 2019", "url": "https://www.internationalguideline.com/static/pdfs/Quick_Reference_Guide-10Mar2020.pdf"}, {"label": "ISBI Practice Guidelines for Burn Care 2016", "url": "https://www.worldburn.org/resources/isbi-practice-guidelines-for-burn-care/"}, {"label": "EWMA/WUWHS Wound Infection and Biofilm Management Consensus 2016", "url": "https://www.wuwhs2016.com/"}, {"label": "Gardner SE et al. Wound culture technique comparison (Wound Repair Regen 2006)", "url": "https://pubmed.ncbi.nlm.nih.gov/16674555/"}, {"label": "Zelen CM et al. dHACM for DFU — RCT (J Wound Care 2014)", "url": "https://pubmed.ncbi.nlm.nih.gov/24842571/"}, {"label": "Cutting KF et al. Betaine/PHMB (Prontosan) wound cleanser review (J Wound Care 2010)", "url": "https://pubmed.ncbi.nlm.nih.gov/20539230/"}]}];
  const CLINICAL_SOURCES_DEEP_DIVE = [
    {
      title: "Deep-Dive Triggers Used in This Build",
      items: [
        { label: "IWGDF PAD Guideline (2023) - 4-week <50% DFU improvement trigger", url: "https://iwgdfguidelines.org/wp-content/uploads/2023/07/IWGDF-2023-05-PAD-Guideline.pdf" },
        { label: "IWGDF Practical Guideline (2023) - 4-6 week non-healing reassessment language", url: "https://iwgdfguidelines.org/wp-content/uploads/2023/07/IWGDF-2023-01-Practical-Guidelines.pdf" },
        { label: "IWGDF Offloading Guideline (2023) - non-removable knee-high first choice", url: "https://iwgdfguidelines.org/wp-content/uploads/2023/07/IWGDF-2023-06-Offloading-Guideline.pdf" },
        { label: "IWGDF/IDSA Infection Guideline (2023) - avoid antibiotics for clinically uninfected DFU", url: "https://iwgdfguidelines.org/wp-content/uploads/2023/07/IWGDF-2023-04-Infection-Guideline.pdf" },
        { label: "DailyMed Santyl label - silver/heavy metal compatibility cautions", url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=6b6fbfc6-98fa-46aa-88ef-ab00fbb08ffd" },
      ],
    },
,
    {
      title: "New Wound Type Pathways — Clinical Sources",
      items: [
        { label: "Marx RE. Osteoradionecrosis: A new concept of its pathophysiology. J Oral Maxillofac Surg 1983 — foundational HBOT/ORN RCT", url: "https://pubmed.ncbi.nlm.nih.gov/6225632/" },
        { label: "Delanian S et al. Striking regression of chronic radiotherapy damage (pentoxifylline + Vit E). J Clin Oncol 2003 (PMID 12637469)", url: "https://pubmed.ncbi.nlm.nih.gov/12637469/" },
        { label: "Hamid O et al. / Kimball AB et al. — PIONEER I and II: adalimumab for moderate-to-severe hidradenitis suppurativa. NEJM 2016 (PMID 27518661)", url: "https://pubmed.ncbi.nlm.nih.gov/27518661/" },
        { label: "Brocard A et al. Zinc gluconate for hidradenitis suppurativa: a randomised prospective study. Dermatology 2007 (PMID 17341870)", url: "https://pubmed.ncbi.nlm.nih.gov/17341870/" },
        { label: "Stone JH et al. RAVE trial — rituximab vs cyclophosphamide for ANCA vasculitis. NEJM 2010 (PMID 20647199)", url: "https://pubmed.ncbi.nlm.nih.gov/20647199/" },
        { label: "Li HK et al. OVIVA trial — oral vs IV antibiotics for bone and joint infections. NEJM 2019 (PMID 30699315)", url: "https://pubmed.ncbi.nlm.nih.gov/30699315/" },
        { label: "Diggelmann HR et al. Hyaluronic acid gel vs mepilex lite for radiation dermatitis — Int J Radiat Oncol Biol Phys 2010 (PMID 20421149)", url: "https://pubmed.ncbi.nlm.nih.gov/20421149/" },
        { label: "MASCC/ISOO Consensus on Radiation Dermatitis Clinical Practice Guidelines 2020", url: "https://www.mascc.org/radiation-dermatitis" },
        { label: "Hafner J et al. Martorell hypertensive ischemic leg ulcer. Dermatology 2010 (PMID 20689247)", url: "https://pubmed.ncbi.nlm.nih.gov/20689247/" },
        { label: "Tawfick W et al. Martorell ulcer — HBOT experience. Eur J Vasc Endovasc Surg 2013 (PMID 23290862)", url: "https://pubmed.ncbi.nlm.nih.gov/23290862/" },
        { label: "Cochrane: Dressings for donor site wounds after split-thickness skin graft (Ubbink DT, 2013)", url: "https://www.cochrane.org/CD001517/WOUNDS_dressings-for-donor-site-wounds-after-split-thickness-skin-graft" },
        { label: "IDSA/SHEA Surgical Site Infection Prevention Guidelines 2022", url: "https://www.idsociety.org/practice-guideline/surgical-site-infection/" },
        { label: "UHMS — Hyperbaric oxygen indications: osteoradionecrosis and radiation tissue injury (14th ed.)", url: "https://www.uhms.org/resources/hbo-indications.html" },
        { label: "Jemec GBE et al. Topical clindamycin vs systemic tetracycline in HS — RCT. Dermatology 1998 (PMID 9568396)", url: "https://pubmed.ncbi.nlm.nih.gov/9568396/" },
        { label: "CTCAE v5.0 — NCI Common Terminology Criteria for Adverse Events (radiation dermatitis grading)", url: "https://ctep.cancer.gov/protocoldevelopment/electronic_applications/ctc.htm" },
      ],
    }
  ];

  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
  const DATE_RANGE_RE = /(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})/;
  const HISTORY_KEY = "OW_WOUND_HISTORY_V1";
  const HISTORY_API_BASE = "";
  const HISTORY_API_TOKEN = "";
  const HISTORY_RESET_ALL_PATH = "/history/reset_all";
  const HISTORY_ADMIN_POLICY_GET_PATH = "/history/admin_policy_get";
  const HISTORY_ADMIN_POLICY_SET_PATH = "/history/admin_policy_set";
  const HISTORY_PURGE_PATH = "/history/purge";
  const HISTORY_AUDIT_LOG_PATH = "/history/audit_log";
  const HISTORY_USAGE_EVENT_PATH = "/history/usage_event";
  const HISTORY_API_USE_ACCESS_JWT = false;
  const CLOUD_HISTORY_ONLY_WHEN_AUTHED = true;
  const SUPPLY_PREF_KEY = "OW_SUPPLY_PREFS_V1";
  const SUPPLY_PREF_DEVICE_MIGRATION_KEY = "OW_SUPPLY_PREF_DEVICE_MIGRATION_V1";
  const RERUN_OVERRIDE_KEY = "OW_RERUN_WOUND_OVERRIDES_V1";
  const NARRATIVE_STYLE_KEY = "OW_NARRATIVE_STYLE_V1";
  const NARRATIVE_PHRASES_KEY = "OW_NARRATIVE_PHRASES_V1";
  const HIPAA_POLICY_KEY = "OW_HIPAA_POLICY_V1";
  const AUDIT_LOG_KEY = "OW_HIPAA_AUDIT_LOG_V1";
  const USER_LABEL_KEY = "OW_ACTIVE_USER_LABEL_V1";
  const DEFAULT_NARRATIVE_STYLE = "detailed";
  const HIPAA_DEFAULT_RETENTION_DAYS = 180;
  const HIPAA_MIN_RETENTION_DAYS = 7;
  const HIPAA_MAX_RETENTION_DAYS = 3650;
  const AUDIT_LOG_LOCAL_LIMIT = 600;
  const DEFAULT_AUDIT_FETCH_LIMIT = 200;
  const PREVIEW_CHUNK_THRESHOLD = 180;
  const PREVIEW_CHUNK_SIZE = 48;
  const APP_LOCAL_STORAGE_KEYS = [
    SUPPLY_PREF_KEY,
    SUPPLY_PREF_DEVICE_MIGRATION_KEY,
    NARRATIVE_STYLE_KEY,
    NARRATIVE_PHRASES_KEY,
    HIPAA_POLICY_KEY,
    USER_LABEL_KEY,
  ];
  const NARRATIVE_STYLE_OPTIONS = new Set(["detailed", "concise"]);
  const DEFAULT_NARRATIVE_PHRASES = {
    intro_single: "Today I saw {patient_name} for follow-up of 1 wound.",
    intro_multi: "Today I saw {patient_name} for follow-up of {wound_count} wounds.",
    wound_line: "{wound_ref}: {article} {wound_type} {location_phrase}.",
    measurement_line: "Size today: {length} cm x {width} cm x {depth} cm (area {area} cm2).",
    measurement_unavailable_line: "Size today was not available in the export.",
    status_improving: "The wound appears to be improving.",
    status_worsening: "The wound appears to be deteriorating.",
    status_mixed: "The wound shows a mixed response.",
    status_active: "The wound remains active and is being followed closely.",
    status_stalled: "The wound remains active without strong signs of healing progress.",
    status_healed: "The wound appears healed at this visit.",
    status_healed_conflict: "Charted as healed/resolved, but current wound data still suggests an active wound.",
    status_new: "The wound remains active and in early follow-up.",
    status_charted_fallback: "The wound remains active; charted status is \"{status}\".",
    pathway_sentence: "Overall this wound is following {pathway_phrase}.",
    pathway_pressure: "a pressure injury pattern",
    pathway_venous: "a venous ulcer pattern",
    pathway_diabetic_foot: "a diabetic foot ulcer pattern",
    pathway_arterial: "an arterial/ischemic wound pattern",
    pathway_mixed_leg: "a mixed arterial and venous pattern",
    pathway_general: "a general chronic wound pattern",
    trend_line_with_reason: "Compared with last week, the wound trend appears {signal} ({reason}).",
    trend_line_without_reason: "Compared with last week, the wound trend appears {signal}.",
    manual_override_line: "Additional clinical details today: {details}",
    tissue_line: "Wound-bed characteristics were documented as {details}.",
  };
  const NARRATIVE_PHRASE_FIELDS = [
    { key: "intro_single", label: "Intro (Single Wound)", help: "Use {patient_name}." },
    { key: "intro_multi", label: "Intro (Multiple Wounds)", help: "Use {patient_name} and {wound_count}." },
    { key: "wound_line", label: "Wound Opening", help: "Use {wound_ref}, {article}, {wound_type}, {location_phrase}." },
    { key: "measurement_line", label: "Measurement Line", help: "Use {length}, {width}, {depth}, {area}." },
    { key: "measurement_unavailable_line", label: "No Measurement Line", help: "Used when measurements are missing." },
    { key: "status_improving", label: "Status: Improving", help: "Narrative sentence for improving wounds." },
    { key: "status_worsening", label: "Status: Worsening", help: "Narrative sentence for worsening wounds." },
    { key: "status_stalled", label: "Status: Stalled", help: "Narrative sentence for stalled wounds." },
    { key: "status_active", label: "Status: Active", help: "Narrative sentence for active wounds." },
    { key: "status_healed", label: "Status: Healed", help: "Narrative sentence when healed." },
    { key: "status_healed_conflict", label: "Status: Healed Conflict", help: "Used when chart says healed but data looks active." },
    { key: "pathway_sentence", label: "Pathway Sentence", help: "Use {pathway_phrase}." },
    { key: "trend_line_with_reason", label: "Trend With Reason", help: "Use {signal} and {reason}." },
    { key: "trend_line_without_reason", label: "Trend Without Reason", help: "Use {signal}." },
    { key: "manual_override_line", label: "Clinical Detail Line", help: "Use {details}." },
  ];
  const SUPPLY_GROUP_ORDER = [
    "Debridement Types",
    "Dressings",
    "Periwound",
    "Covering / Securement",
    "Cleansing / Solutions",
    "Antimicrobial",
    "Offloading / Compression",
    "Advanced Therapies",
    "Systemic / Supportive",
    "Escalation / Surgical",
    "Other",
  ];

  const THRESHOLDS = {
    debridement_slough_pct: 40.0,
    debridement_slough_moderate_pct: 20.0,
    debridement_eschar_pct: 20.0,
    heel_stable_eschar_pct: 80.0,
    clean_bed_slough_max_pct: 20.0,
    collagen_min_granulation_pct: 30.0,
    collagen_max_granulation_pct: 90.0,
    worsening_area_pct: 20.0,
    worsening_depth_cm: 0.2,
    chronic_days: 30,
    four_week_window_min_days: 21,
    diabetic_four_week_area_reduction_target_pct: 50.0,
    venous_four_week_area_reduction_target_pct: 30.0,
  };

  const OVERRIDE_THICKNESS_OPTIONS = [
    { value: "", label: "Not set" },
    { value: "partial_thickness", label: "Partial thickness" },
    { value: "full_thickness", label: "Full thickness" },
    { value: "eschar_covered", label: "Eschar covered" },
  ];
  const OVERRIDE_EXUDATE_AMOUNT_OPTIONS = [
    { value: "", label: "Not set" },
    { value: "scant", label: "Scant" },
    { value: "small", label: "Small" },
    { value: "moderate", label: "Moderate" },
    { value: "large", label: "Large" },
    { value: "copious", label: "Copious" },
  ];
  const OVERRIDE_EXUDATE_TYPE_OPTIONS = [
    { value: "", label: "Not set" },
    { value: "serous", label: "Serous" },
    { value: "serosanguineous", label: "Serosanguineous" },
    { value: "sanguineous", label: "Sanguineous" },
    { value: "purulent", label: "Purulent" },
    { value: "green_brown", label: "Green/Brown" },
    { value: "thick_viscous", label: "Thick/Viscous" },
    { value: "mixed", label: "Mixed" },
  ];
  const OVERRIDE_ODOR_OPTIONS = [
    { value: "", label: "Not set" },
    { value: "none", label: "None" },
    { value: "mild", label: "Mild" },
    { value: "moderate", label: "Moderate" },
    { value: "strong_foul", label: "Strong/Foul" },
  ];
  const OVERRIDE_EXPOSED_STRUCTURE_OPTIONS = [
    { value: "adipose", label: "Adipose" },
    { value: "muscle", label: "Muscle" },
    { value: "tendon", label: "Tendon" },
    { value: "capsule", label: "Capsule" },
    { value: "joint", label: "Joint" },
    { value: "bone", label: "Bone" },
  ];
  const OVERRIDE_INFECTION_SIGN_OPTIONS = [
    { value: "erythema", label: "Erythema" },
    { value: "warmth", label: "Warmth" },
    { value: "edema", label: "Edema" },
    { value: "increased_pain", label: "Increased pain" },
    { value: "purulent_drainage", label: "Purulent drainage" },
    { value: "malodor", label: "Malodor" },
    { value: "friable_tissue", label: "Friable tissue" },
    { value: "delayed_healing", label: "Delayed healing" },
  ];
  const OVERRIDE_EXUDATE_SEVERITY = { scant: 0, small: 1, moderate: 2, large: 3, copious: 4 };
  const OVERRIDE_VALUE_LABELS = new Map(
    []
      .concat(OVERRIDE_THICKNESS_OPTIONS)
      .concat(OVERRIDE_EXUDATE_AMOUNT_OPTIONS)
      .concat(OVERRIDE_EXUDATE_TYPE_OPTIONS)
      .concat(OVERRIDE_ODOR_OPTIONS)
      .concat(OVERRIDE_EXPOSED_STRUCTURE_OPTIONS)
      .concat(OVERRIDE_INFECTION_SIGN_OPTIONS)
      .map((opt) => [opt.value, opt.label]),
  );

  const els = {
    analyzeForm: document.getElementById("analyzeForm"),
    manualWoundList: document.getElementById("manualWoundList"),
    addWoundButtonBottom: document.getElementById("addWoundButtonBottom"),
    historyDir: document.getElementById("historyDir"),
    historyApi: document.getElementById("historyApi"),
    runBtn: document.getElementById("runBtn"),
    statusText: document.getElementById("statusText"),
    settingsButton: document.getElementById("settingsButton"),
    settingsPanel: document.getElementById("settingsPanel"),
    settingsClose: document.getElementById("settingsClose"),
    settingsSuppliesButton: document.getElementById("settingsSuppliesButton"),
    settingsPhraseButton: document.getElementById("settingsPhraseButton"),
    settingsResetSuppliesButton: document.getElementById("settingsResetSuppliesButton"),
    settingsResetPhrasesButton: document.getElementById("settingsResetPhrasesButton"),
    settingsResetNarrativeStyleButton: document.getElementById("settingsResetNarrativeStyleButton"),
    settingsUserLabel: document.getElementById("settingsUserLabel"),
    settingsSaveUserLabelButton: document.getElementById("settingsSaveUserLabelButton"),
    narrativePanel: document.getElementById("narrativePanel"),
    narrativeText: document.getElementById("narrativeText"),
    narrativeStyle: document.getElementById("narrativeStyle"),
    nameGateOverlay: document.getElementById("nameGateOverlay"),
    authTitle: document.getElementById("authTitle"),
    authLoginForm: document.getElementById("authLoginForm"),
    authRegisterForm: document.getElementById("authRegisterForm"),
    authForgotForm: document.getElementById("authForgotForm"),
    loginUsername: document.getElementById("loginUsername"),
    loginPassword: document.getElementById("loginPassword"),
    loginError: document.getElementById("loginError"),
    registerUsername: document.getElementById("registerUsername"),
    registerEmail: document.getElementById("registerEmail"),
    registerPassword: document.getElementById("registerPassword"),
    registerPasswordConfirm: document.getElementById("registerPasswordConfirm"),
    registerClinicalAck: document.getElementById("registerClinicalAck"),
    registerAgreeAck: document.getElementById("registerAgreeAck"),
    registerError: document.getElementById("registerError"),
    forgotUsername: document.getElementById("forgotUsername"),
    forgotError: document.getElementById("forgotError"),
    forgotSuccess: document.getElementById("forgotSuccess"),
    nameGateTermsLink: document.getElementById("nameGateTermsLink"),
    termsDialog: document.getElementById("termsDialog"),
    termsDialogClose: document.getElementById("termsDialogClose"),
    appRoot: document.getElementById("appRoot"),
    auditLogPanel: document.getElementById("auditLogPanel"),
    auditLogClose: document.getElementById("auditLogClose"),
    auditLogMeta: document.getElementById("auditLogMeta"),
    auditLogSummary: document.getElementById("auditLogSummary"),
    auditLogHead: document.querySelector("#auditLogTable thead"),
    auditLogBody: document.querySelector("#auditLogTable tbody"),
    userAdminSection: document.getElementById("userAdminSection"),
    userAdminRefresh: document.getElementById("userAdminRefresh"),
    userAdminMeta: document.getElementById("userAdminMeta"),
    userAdminHead: document.querySelector("#userAdminTable thead"),
    userAdminBody: document.querySelector("#userAdminTable tbody"),
    previewPanel: document.getElementById("previewPanel"),
    printPacketButton: document.getElementById("printPacketButton"),
    previewHead: document.querySelector("#previewTable thead"),
    previewBody: document.querySelector("#previewTable tbody"),
    sourceButton: document.getElementById("sourceButton"),
    suppliesPanel: document.getElementById("suppliesPanel"),
    suppliesList: document.getElementById("suppliesList"),
    suppliesClose: document.getElementById("suppliesClose"),
    suppliesSelectAll: document.getElementById("suppliesSelectAll"),
    suppliesClearAll: document.getElementById("suppliesClearAll"),
    phrasesPanel: document.getElementById("phrasesPanel"),
    phrasesForm: document.getElementById("phrasesForm"),
    phraseFields: document.getElementById("phraseFields"),
    phrasesClose: document.getElementById("phrasesClose"),
    phrasesReset: document.getElementById("phrasesReset"),
    sourcesPanel: document.getElementById("sourcesPanel"),
    sourcesClose: document.getElementById("sourcesClose"),
    sourceList: document.getElementById("sourceList"),
    sourceMapHead: document.querySelector("#sourceMapTable thead"),
    sourceMapBody: document.querySelector("#sourceMapTable tbody"),
    printPacketPanel: document.getElementById("printPacketPanel"),
    printPacketContent: document.getElementById("printPacketContent"),
  };

  let latestOutputs = null;
  let supplyEntries = [];
  let selectedSupplyKeys = new Set();
  let historyApiBase = "";
  let historyApiToken = "";
  let historyApiUseAccessJwt = false;
  let rerunOverrideStore = { version: 1, items: {} };
  let narrativeStyle = DEFAULT_NARRATIVE_STYLE;
  let narrativePhraseOverrides = {};
  let hipaaPolicy = null;
  let usageAccessLogged = false;
  let previewRenderToken = 0;
  let manualWoundSerial = 0;

  function setStatus(text) {
    if (els.statusText) els.statusText.textContent = text;
  }

  function setBusy(isBusy) {
    if (els.runBtn) els.runBtn.disabled = isBusy;
    if (els.addWoundButtonBottom) els.addWoundButtonBottom.disabled = isBusy;
    if (els.historyDir) els.historyDir.disabled = true;
    if (els.historyApi) els.historyApi.disabled = isBusy;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function normalizeText(value) {
    if (value == null) return "";
    return String(value).trim().toLowerCase().replace(/\s+/g, " ");
  }

  function fillTemplate(template, vars) {
    return String(template || "").replace(/\{([a-z0-9_]+)\}/gi, (match, key) => {
      const value = vars && Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : "";
      return value == null ? "" : String(value);
    });
  }

  function getNarrativePhrase(key) {
    const override = narrativePhraseOverrides && typeof narrativePhraseOverrides === "object"
      ? narrativePhraseOverrides[key]
      : "";
    if (typeof override === "string" && override.trim()) return override.trim();
    return DEFAULT_NARRATIVE_PHRASES[key] || "";
  }

  function normalizeNarrativeStyle(value) {
    const style = normalizeText(value);
    return NARRATIVE_STYLE_OPTIONS.has(style) ? style : DEFAULT_NARRATIVE_STYLE;
  }

  function sanitizeNarrativePhraseOverrides(input) {
    const out = {};
    const source = input && typeof input === "object" ? input : {};
    const allowedKeys = Object.keys(DEFAULT_NARRATIVE_PHRASES);
    allowedKeys.forEach((key) => {
      const value = source[key];
      if (typeof value !== "string") return;
      const trimmed = value.trim();
      if (!trimmed) return;
      out[key] = trimmed.slice(0, 500);
    });
    return out;
  }

  function loadNarrativePhraseOverrides() {
    try {
      const raw = localStorage.getItem(NARRATIVE_PHRASES_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return sanitizeNarrativePhraseOverrides(parsed);
    } catch {
      return {};
    }
  }

  function saveNarrativePhraseOverrides() {
    try {
      localStorage.setItem(NARRATIVE_PHRASES_KEY, JSON.stringify(sanitizeNarrativePhraseOverrides(narrativePhraseOverrides)));
    } catch {
      // no-op
    }
  }

  function loadNarrativeStyle() {
    try {
      return normalizeNarrativeStyle(localStorage.getItem(NARRATIVE_STYLE_KEY));
    } catch {
      return DEFAULT_NARRATIVE_STYLE;
    }
  }

  function saveNarrativeStyle(style) {
    const normalized = normalizeNarrativeStyle(style);
    narrativeStyle = normalized;
    try {
      localStorage.setItem(NARRATIVE_STYLE_KEY, normalized);
    } catch {
      // no-op
    }
  }

  function titleCaseToken(token) {
    const raw = String(token || "");
    if (!raw) return "";
    if (/[a-z]/.test(raw) && /[A-Z]/.test(raw)) return raw;
    return raw
      .toLowerCase()
      .replace(/(^|[-'])([a-z])/g, (match, lead, letter) => `${lead}${letter.toUpperCase()}`);
  }

  function normalizePersonName(rawName) {
    const raw = String(rawName || "").trim();
    if (!raw) return "";

    const commaParts = raw.split(",").map((part) => part.trim()).filter(Boolean);
    let ordered = raw;
    if (commaParts.length >= 2) {
      const last = commaParts[0];
      const given = commaParts.slice(1).join(" ");
      ordered = `${given} ${last}`.replace(/\s+/g, " ").trim();
    }

    const titled = ordered
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => titleCaseToken(token))
      .join(" ");

    return titled
      .replace(/\bJr\b/g, "Jr.")
      .replace(/\bSr\b/g, "Sr.")
      .replace(/\bIi\b/g, "II")
      .replace(/\bIii\b/g, "III")
      .replace(/\bIv\b/g, "IV")
      .replace(/\bVi\b/g, "VI")
      .replace(/\bVii\b/g, "VII")
      .replace(/\bViii\b/g, "VIII")
      .replace(/\bIx\b/g, "IX");
  }

  function normalizeOverrideValue(value) {
    return normalizeText(value).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }

  function normalizeOverrideList(values, allowedValues) {
    const allowed = new Set((allowedValues || []).map((item) => item.value));
    const incoming = Array.isArray(values)
      ? values
      : String(values || "")
          .split("|")
          .map((x) => x.trim())
          .filter(Boolean);
    const seen = new Set();
    const out = [];
    incoming.forEach((item) => {
      const value = normalizeOverrideValue(item);
      if (!value || !allowed.has(value) || seen.has(value)) return;
      seen.add(value);
      out.push(value);
    });
    return out;
  }

  function normalizeManualOverrides(manual) {
    const input = manual && typeof manual === "object" ? manual : {};
    const diabeticRaw = normalizeText(input.diabetic);
    const diabetic = diabeticRaw === "yes" ? "yes" : diabeticRaw === "no" ? "no" : "";

    const toAllowedValue = (rawValue, options) => {
      const value = normalizeOverrideValue(rawValue);
      const allowed = new Set(options.map((item) => item.value));
      return allowed.has(value) ? value : "";
    };

    return {
      diabetic,
      thickness: toAllowedValue(input.thickness, OVERRIDE_THICKNESS_OPTIONS),
      exudate_amount: toAllowedValue(input.exudate_amount, OVERRIDE_EXUDATE_AMOUNT_OPTIONS),
      exudate_type: toAllowedValue(input.exudate_type, OVERRIDE_EXUDATE_TYPE_OPTIONS),
      odor: toAllowedValue(input.odor, OVERRIDE_ODOR_OPTIONS),
      exposed_structures: normalizeOverrideList(input.exposed_structures, OVERRIDE_EXPOSED_STRUCTURE_OPTIONS),
      infection_signs: normalizeOverrideList(input.infection_signs, OVERRIDE_INFECTION_SIGN_OPTIONS),
    };
  }

  function hasAnyManualOverride(manual) {
    const normalized = normalizeManualOverrides(manual);
    return Boolean(
      normalized.diabetic ||
      normalized.thickness ||
      normalized.exudate_amount ||
      normalized.exudate_type ||
      normalized.odor ||
      normalized.exposed_structures.length ||
      normalized.infection_signs.length
    );
  }

  function labelForOverrideValue(value) {
    const key = String(value || "").trim();
    if (!key) return "";
    return OVERRIDE_VALUE_LABELS.get(key) || key.replaceAll("_", " ");
  }

  function labelsForOverrideValues(values) {
    const list = Array.isArray(values) ? values : [];
    return list.map((value) => labelForOverrideValue(value)).filter(Boolean);
  }

  function textHasAny(text, patterns) {
    const hay = normalizeText(text);
    if (!hay) return false;
    return (patterns || []).some((pattern) => hay.includes(normalizeText(pattern)));
  }

  function uniqueOverrideValues(values, allowedOptions) {
    const allowed = new Set((allowedOptions || []).map((opt) => opt.value));
    const out = [];
    const seen = new Set();
    (values || []).forEach((raw) => {
      const value = normalizeOverrideValue(raw);
      if (!value || !allowed.has(value) || seen.has(value)) return;
      seen.add(value);
      out.push(value);
    });
    return out;
  }

  function buildReportSignalText(latest) {
    return normalizeText([
      latest?.status,
      latest?.wound_type,
      latest?.stage,
      latest?.location,
      latest?.acquired_at_facility,
      latest?.exudate_amount_text,
      latest?.exudate_type_text,
      latest?.odor_text,
      latest?.tunneling_text,
      latest?.undermining_text,
      latest?.exposed_structures_text,
      latest?.infection_signs_text,
      latest?.periwound_text,
      latest?.pain_text,
    ]
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join(" | "));
  }

  function inferExudateAmountFromReport(latest, reportText) {
    const text = normalizeText(`${latest?.exudate_amount_text || ""} | ${reportText || ""}`);
    if (!text) return "";
    if (textHasAny(text, ["copious", "profuse", "very heavy"])) return "copious";
    if (textHasAny(text, ["large", "heavy", "saturating", "strike through", "soaking"])) return "large";
    if (textHasAny(text, ["moderate"])) return "moderate";
    if (textHasAny(text, ["small", "minimal", "low"])) return "small";
    if (textHasAny(text, ["scant", "trace", "dry"])) return "scant";
    return "";
  }

  function inferExudateTypeFromReport(latest, reportText) {
    const text = normalizeText(`${latest?.exudate_type_text || ""} | ${reportText || ""}`);
    if (!text) return "";
    if (textHasAny(text, ["purulent", "pus"])) return "purulent";
    if (textHasAny(text, ["green", "brown"])) return "green_brown";
    if (textHasAny(text, ["thick", "viscous", "tenacious"])) return "thick_viscous";
    if (textHasAny(text, ["mixed"])) return "mixed";
    if (textHasAny(text, ["serosanguinous", "sero sanguinous", "sero-sanguinous"])) return "serosanguineous";
    if (textHasAny(text, ["sanguineous", "bloody"])) return "sanguineous";
    if (textHasAny(text, ["serous", "clear"])) return "serous";
    return "";
  }

  function inferOdorFromReport(latest, reportText) {
    const text = normalizeText(`${latest?.odor_text || ""} | ${reportText || ""}`);
    if (!text) return "";
    if (textHasAny(text, ["strong foul", "foul odor", "foul odour", "malodor", "malodour", "fetid", "putrid"])) return "strong_foul";
    if (textHasAny(text, ["moderate odor", "moderate odour", "odor present", "odour present"])) return "moderate";
    if (textHasAny(text, ["mild odor", "mild odour"])) return "mild";
    if (textHasAny(text, ["no odor", "no odour", "odor absent", "odour absent"])) return "none";
    return "";
  }

  function inferInfectionSignsFromReport(latest, reportText) {
    const text = normalizeText(`${latest?.infection_signs_text || ""} | ${latest?.status || ""} | ${reportText || ""}`);
    const out = [];
    if (textHasAny(text, ["erythema", "redness", "cellulitis"])) out.push("erythema");
    if (textHasAny(text, ["warmth", "warm"])) out.push("warmth");
    if (textHasAny(text, ["edema", "oedema", "swelling"])) out.push("edema");
    if (textHasAny(text, ["increased pain", "worsening pain"])) out.push("increased_pain");
    if (textHasAny(text, ["purulent", "pus"])) out.push("purulent_drainage");
    if (textHasAny(text, ["malodor", "malodour", "foul odor", "foul odour", "fetid"])) out.push("malodor");
    if (textHasAny(text, ["friable"])) out.push("friable_tissue");
    if (textHasAny(text, ["delayed healing", "stalled", "non healing", "non-healing"])) out.push("delayed_healing");
    return uniqueOverrideValues(out, OVERRIDE_INFECTION_SIGN_OPTIONS);
  }

  function inferExposedStructuresFromReport(latest, reportText) {
    const text = normalizeText(`${latest?.exposed_structures_text || ""} | ${reportText || ""}`);
    const out = [];
    if (textHasAny(text, ["adipose", "fat exposed", "subcutaneous"])) out.push("adipose");
    if (textHasAny(text, ["muscle", "myofascial"])) out.push("muscle");
    if (textHasAny(text, ["tendon"])) out.push("tendon");
    if (textHasAny(text, ["capsule"])) out.push("capsule");
    if (textHasAny(text, ["joint"])) out.push("joint");
    if (textHasAny(text, ["bone", "osseous"])) out.push("bone");
    return uniqueOverrideValues(out, OVERRIDE_EXPOSED_STRUCTURE_OPTIONS);
  }

  function inferReportSignals(latest) {
    const reportText = buildReportSignalText(latest);
    const inferredExudateAmount = inferExudateAmountFromReport(latest, reportText);
    const inferredExudateType = inferExudateTypeFromReport(latest, reportText);
    const inferredOdor = inferOdorFromReport(latest, reportText);
    const inferredInfectionSigns = inferInfectionSignsFromReport(latest, reportText);
    const inferredExposedStructures = inferExposedStructuresFromReport(latest, reportText);

    const cavitySignal = textHasAny(reportText, [
      "tunnel",
      "tunneling",
      "tunnelling",
      "undermin",
      "sinus tract",
      "cavity",
      "dehisc",
    ]);
    const necroticSignal = textHasAny(reportText, [
      "necrotic",
      "slough",
      "eschar",
      "devitalized",
      "fibrin",
      "gangrene",
    ]);
    const stableDryHeelEscharSignal = textHasAny(reportText, [
      "stable dry heel eschar",
      "dry stable heel eschar",
      "dry heel eschar",
    ]);

    return {
      reportText,
      inferredExudateAmount,
      inferredExudateType,
      inferredOdor,
      inferredInfectionSigns,
      inferredExposedStructures,
      cavitySignal,
      necroticSignal,
      stableDryHeelEscharSignal,
    };
  }

  function canonicalHeader(value) {
    return normalizeText(value).replace(/[^a-z0-9#]+/g, " ").trim();
  }

  function slugify(value) {
    const s = normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return s || "unknown-facility";
  }

  function normalizeHistoryApiBase(value) {
    return String(value || "").trim().replace(/\/+$/, "");
  }

  function normalizeHistoryApiToken(value) {
    return String(value || "").trim();
  }

  function normalizeBoolean(value, defaultValue = false) {
    if (typeof value === "boolean") return value;
    const text = normalizeText(value);
    if (!text) return defaultValue;
    if (["1", "true", "yes", "on"].includes(text)) return true;
    if (["0", "false", "no", "off"].includes(text)) return false;
    return defaultValue;
  }


  function readyStatusText() {
    return "Ready. Enter wound details, then click Generate Considerations.";
  }

  /* ── Authentication ──────────────────────────────────────────────────── */

  const AUTH_STORAGE_KEY = "CICATRIX_AUTH_V1";
  let authState = null; /* { username, token, role, email } once signed in */

  const AUTH_ERROR_MESSAGES = {
    username_required: "Enter a username.",
    username_too_short: "Username must be at least 3 characters.",
    password_too_short: "Password must be at least 8 characters.",
    terms_required: "You must accept the terms to register.",
    username_taken: "That username is already taken.",
    credentials_required: "Enter your username and password.",
    invalid_credentials: "Incorrect username or password.",
    not_authorized: "You are not authorized to do that.",
    user_not_found: "That account no longer exists.",
    cannot_delete_self: "You cannot delete the account you are signed in with.",
    kv_not_configured: "Account service is not set up yet. Contact the administrator.",
  };

  function authErrorText(code) {
    return AUTH_ERROR_MESSAGES[code] || "Something went wrong. Please try again.";
  }

  function loadStoredAuth() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.username && parsed.token) return parsed;
    } catch { /* ignore */ }
    return null;
  }

  function saveStoredAuth(obj) {
    try { localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(obj)); } catch { /* ignore */ }
  }

  function clearStoredAuth() {
    try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch { /* ignore */ }
  }

  function isCurrentUserAdmin() {
    return Boolean(authState && authState.role === "admin");
  }

  /** POST to /auth. Returns { ok, status, data, networkError }. */
  async function authFetch(payload) {
    try {
      const res = await fetch("/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data = {};
      try { data = await res.json(); } catch { /* non-JSON */ }
      return { ok: res.ok && data.ok !== false, status: res.status, data, networkError: false };
    } catch (err) {
      return { ok: false, status: 0, data: {}, networkError: true };
    }
  }

  function setAppAccessLocked(isLocked) {
    const locked = Boolean(isLocked);
    document.body.classList.toggle("name-gate-active", locked);
    if (els.nameGateOverlay) els.nameGateOverlay.hidden = !locked;
    if (els.appRoot) {
      if (locked) {
        els.appRoot.setAttribute("inert", "");
        els.appRoot.setAttribute("aria-hidden", "true");
      } else {
        els.appRoot.removeAttribute("inert");
        els.appRoot.removeAttribute("aria-hidden");
      }
    }
    if (locked) setTimeout(() => focusActiveAuthView(), 0);
  }

  function activeAuthView() {
    if (els.authRegisterForm && !els.authRegisterForm.classList.contains("hidden")) return "register";
    if (els.authForgotForm && !els.authForgotForm.classList.contains("hidden")) return "forgot";
    return "login";
  }

  function focusActiveAuthView() {
    const view = activeAuthView();
    if (view === "register") els.registerUsername?.focus();
    else if (view === "forgot") els.forgotUsername?.focus();
    else els.loginUsername?.focus();
  }

  function showAuthView(view) {
    const map = {
      login: { form: els.authLoginForm, title: "Sign In" },
      register: { form: els.authRegisterForm, title: "Create Account" },
      forgot: { form: els.authForgotForm, title: "Reset Password" },
    };
    Object.values(map).forEach((m) => m.form && m.form.classList.add("hidden"));
    const target = map[view] || map.login;
    if (target.form) target.form.classList.remove("hidden");
    if (els.authTitle) els.authTitle.textContent = target.title;
    if (els.loginError) els.loginError.textContent = "";
    if (els.registerError) els.registerError.textContent = "";
    if (els.forgotError) els.forgotError.textContent = "";
    if (els.forgotSuccess) els.forgotSuccess.textContent = "";
    setTimeout(() => focusActiveAuthView(), 0);
  }

  function applyAuthSuccess(data, token) {
    authState = {
      username: data.username,
      token,
      role: data.role || "user",
      email: data.email || "",
    };
    saveStoredAuth({ username: authState.username, token });
    if (els.settingsUserLabel) els.settingsUserLabel.value = authState.username;
    setAppAccessLocked(false);
    if (els.userAdminSection) els.userAdminSection.classList.toggle("hidden", !isCurrentUserAdmin());
    logUsageEvent("login", { user: authState.username, role: authState.role }, { cloud: true, local: true });
    logSiteAccessOnce();
    setStatus(readyStatusText());
  }

  function openTermsDialog(event) {
    if (event) event.preventDefault();
    if (!els.termsDialog) return;
    els.termsDialog.hidden = false;
    setTimeout(() => els.termsDialogClose?.focus(), 0);
  }

  function closeTermsDialog() {
    if (!els.termsDialog) return;
    els.termsDialog.hidden = true;
    els.nameGateTermsLink?.focus();
  }

  function guardNameGateFocus(event) {
    if (!document.body.classList.contains("name-gate-active")) return;
    if (!els.nameGateOverlay || els.nameGateOverlay.contains(event.target)) return;
    event.stopPropagation();
    focusActiveAuthView();
  }

  function logSiteAccessOnce() {
    if (usageAccessLogged) return;
    usageAccessLogged = true;
    logUsageEvent("site_access", { path: window.location.pathname || "/" });
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    if (els.loginError) els.loginError.textContent = "";
    const username = String(els.loginUsername?.value || "").trim();
    const password = String(els.loginPassword?.value || "");
    if (!username || !password) {
      if (els.loginError) els.loginError.textContent = "Enter your username and password.";
      return;
    }
    const submitBtn = els.authLoginForm?.querySelector("button[type=submit]");
    if (submitBtn) submitBtn.disabled = true;
    const res = await authFetch({ action: "login", username, password });
    if (submitBtn) submitBtn.disabled = false;
    if (res.ok) {
      if (els.loginPassword) els.loginPassword.value = "";
      applyAuthSuccess(res.data, res.data.token);
      return;
    }
    if (res.networkError) {
      if (els.loginError) els.loginError.textContent = "Network error — check your connection and try again.";
      return;
    }
    if (els.loginError) els.loginError.textContent = authErrorText(res.data.error);
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    if (els.registerError) els.registerError.textContent = "";
    const username = String(els.registerUsername?.value || "").trim();
    const email = String(els.registerEmail?.value || "").trim();
    const password = String(els.registerPassword?.value || "");
    const confirm = String(els.registerPasswordConfirm?.value || "");

    if (username.length < 3) {
      els.registerError.textContent = "Username must be at least 3 characters.";
      return;
    }
    if (password.length < 8) {
      els.registerError.textContent = "Password must be at least 8 characters.";
      return;
    }
    if (password !== confirm) {
      els.registerError.textContent = "Passwords do not match.";
      return;
    }
    if (!els.registerClinicalAck?.checked || !els.registerAgreeAck?.checked) {
      els.registerError.textContent = "Check both acknowledgements to continue.";
      return;
    }
    const submitBtn = els.authRegisterForm?.querySelector("button[type=submit]");
    if (submitBtn) submitBtn.disabled = true;
    const res = await authFetch({ action: "register", username, email, password, terms_accepted: true });
    if (submitBtn) submitBtn.disabled = false;
    if (res.ok) {
      if (els.registerPassword) els.registerPassword.value = "";
      if (els.registerPasswordConfirm) els.registerPasswordConfirm.value = "";
      applyAuthSuccess(res.data, res.data.token);
      return;
    }
    if (res.networkError) {
      els.registerError.textContent = "Network error — check your connection and try again.";
      return;
    }
    els.registerError.textContent = authErrorText(res.data.error);
  }

  async function handleForgotSubmit(event) {
    event.preventDefault();
    if (els.forgotError) els.forgotError.textContent = "";
    if (els.forgotSuccess) els.forgotSuccess.textContent = "";
    const username = String(els.forgotUsername?.value || "").trim();
    if (!username) {
      els.forgotError.textContent = "Enter your username.";
      return;
    }
    const submitBtn = els.authForgotForm?.querySelector("button[type=submit]");
    if (submitBtn) submitBtn.disabled = true;
    const res = await authFetch({ action: "forgot", username });
    if (submitBtn) submitBtn.disabled = false;
    if (res.networkError) {
      els.forgotError.textContent = "Network error — check your connection and try again.";
      return;
    }
    els.forgotSuccess.textContent = "If that account exists, your administrator has been notified to reset it.";
  }

  /** On load: try to resume a stored session; otherwise lock to the login view. */
  async function initializeAuth() {
    if (!els.nameGateOverlay || !els.authLoginForm) {
      /* Auth UI missing — fail open so the app is still usable */
      setAppAccessLocked(false);
      return true;
    }
    const stored = loadStoredAuth();
    setAppAccessLocked(true);
    showAuthView("login");
    if (!stored) return false;

    const res = await authFetch({ action: "verify", username: stored.username, token: stored.token });
    if (res.ok) {
      applyAuthSuccess(res.data, stored.token);
      return true;
    }
    if (res.networkError) {
      /* Backend unreachable but we have a cached session — trust it so a
         transient outage doesn't lock the user out. */
      authState = { username: stored.username, token: stored.token, role: stored.role || "user", email: "" };
      setAppAccessLocked(false);
      if (els.userAdminSection) els.userAdminSection.classList.toggle("hidden", !isCurrentUserAdmin());
      logSiteAccessOnce();
      setStatus(readyStatusText());
      return true;
    }
    /* Session rejected (expired/invalid) — clear it and show login */
    clearStoredAuth();
    return false;
  }

  /* ── Admin: user management (audit page) ─────────────────────────────── */

  function adminCreds() {
    return { admin_username: authState?.username || "", admin_token: authState?.token || "" };
  }

  async function loadUserAdmin() {
    if (!isCurrentUserAdmin() || !els.userAdminBody) return;
    if (els.userAdminMeta) els.userAdminMeta.textContent = "Loading accounts…";
    const res = await authFetch({ action: "admin_list", ...adminCreds() });
    if (!res.ok) {
      if (els.userAdminMeta) {
        els.userAdminMeta.textContent = res.networkError
          ? "Could not reach the account service."
          : authErrorText(res.data.error);
      }
      return;
    }
    renderUserAdmin(res.data.users || []);
  }

  function renderUserAdmin(users) {
    if (!els.userAdminBody || !els.userAdminHead) return;
    const flagged = users.filter((u) => u.needs_password_reset).length;
    if (els.userAdminMeta) {
      els.userAdminMeta.textContent = `${users.length} account${users.length === 1 ? "" : "s"}` +
        (flagged ? ` · ${flagged} awaiting password reset` : "");
    }
    els.userAdminHead.innerHTML =
      "<tr><th>Username</th><th>Role</th><th>Email</th><th>Created</th><th>Last Login</th><th>Status</th><th>Actions</th></tr>";
    if (!users.length) {
      els.userAdminBody.innerHTML = '<tr><td colspan="7">No accounts registered yet.</td></tr>';
      return;
    }
    els.userAdminBody.innerHTML = users.map((u) => {
      const flaggedRow = u.needs_password_reset ? ' class="user-flagged"' : "";
      const status = u.needs_password_reset
        ? `<span class="user-badge user-badge-warn">Reset requested${u.reset_requested_at ? " · " + escapeHtml(formatAuditTimestamp(u.reset_requested_at)) : ""}</span>`
        : '<span class="user-badge">Active</span>';
      const roleBtn = u.role === "admin" ? "Make User" : "Make Admin";
      const uname = escapeHtml(u.username);
      return `<tr${flaggedRow}>
        <td>${uname}</td>
        <td>${escapeHtml(u.role || "user")}</td>
        <td>${escapeHtml(u.email || "—")}</td>
        <td>${escapeHtml(formatAuditTimestamp(u.created_at) || "—")}</td>
        <td>${escapeHtml(formatAuditTimestamp(u.last_login_at) || "—")}</td>
        <td>${status}</td>
        <td class="user-actions">
          <button type="button" data-user-action="reset" data-user="${uname}">Reset Password</button>
          <button type="button" data-user-action="role" data-user="${uname}" data-role="${escapeHtml(u.role || "user")}">${roleBtn}</button>
          <button type="button" data-user-action="rename" data-user="${uname}">Rename</button>
          <button type="button" data-user-action="email" data-user="${uname}">Edit Email</button>
          <button type="button" data-user-action="delete" data-user="${uname}" class="user-danger">Delete</button>
        </td>
      </tr>`;
    }).join("");
  }

  async function handleUserAdminAction(action, username, extra = {}) {
    const res = await authFetch({ action, target: username, ...extra, ...adminCreds() });
    if (res.ok) {
      logUsageEvent("admin_user_action", { sub_action: action, target: username }, { cloud: true, local: true });
      await loadUserAdmin();
      setStatus(`Account "${username}" updated.`);
      return true;
    }
    const msg = res.networkError ? "Network error — try again." : authErrorText(res.data.error);
    setStatus(msg);
    window.alert(msg);
    return false;
  }

  async function onUserAdminClick(event) {
    const btn = event.target.closest("[data-user-action]");
    if (!btn) return;
    const action = btn.dataset.userAction;
    const username = btn.dataset.user;
    if (!username) return;

    if (action === "reset") {
      const pw = window.prompt(`Enter a new password for "${username}" (8+ characters):`);
      if (pw == null) return;
      if (pw.length < 8) { window.alert("Password must be at least 8 characters."); return; }
      await handleUserAdminAction("admin_reset", username, { new_password: pw });
    } else if (action === "role") {
      const newRole = btn.dataset.role === "admin" ? "user" : "admin";
      if (!window.confirm(`Change "${username}" to role "${newRole}"?`)) return;
      await handleUserAdminAction("admin_update", username, { role: newRole });
    } else if (action === "rename") {
      const newName = window.prompt(`New username for "${username}":`, username);
      if (newName == null) return;
      const trimmed = newName.trim();
      if (trimmed.length < 3) { window.alert("Username must be at least 3 characters."); return; }
      await handleUserAdminAction("admin_update", username, { new_username: trimmed });
    } else if (action === "email") {
      const email = window.prompt(`Email for "${username}":`, "");
      if (email == null) return;
      await handleUserAdminAction("admin_update", username, { email: email.trim() });
    } else if (action === "delete") {
      if (!window.confirm(`Permanently delete account "${username}"? This cannot be undone.`)) return;
      await handleUserAdminAction("admin_delete", username);
    }
  }


  function normalizeRetentionDays(value, fallback = HIPAA_DEFAULT_RETENTION_DAYS) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(HIPAA_MIN_RETENTION_DAYS, Math.min(HIPAA_MAX_RETENTION_DAYS, Math.floor(n)));
  }

  function defaultHipaaPolicy() {
    return {
      version: 1,
      retention_days: HIPAA_DEFAULT_RETENTION_DAYS,
      auto_purge_enabled: true,
      source: "local-default",
      updated_at: "",
      updated_by: "",
    };
  }

  function normalizeHipaaPolicy(raw, fallback = defaultHipaaPolicy()) {
    const input = raw && typeof raw === "object" ? raw : {};
    return {
      version: 1,
      retention_days: normalizeRetentionDays(input.retention_days, fallback.retention_days),
      auto_purge_enabled: normalizeBoolean(input.auto_purge_enabled, fallback.auto_purge_enabled),
      source: String(input.source || fallback.source || "local-default"),
      updated_at: String(input.updated_at || fallback.updated_at || "").trim(),
      updated_by: String(input.updated_by || fallback.updated_by || "").trim(),
    };
  }

  function loadHipaaPolicyLocal() {
    try {
      const raw = localStorage.getItem(HIPAA_POLICY_KEY);
      if (!raw) return defaultHipaaPolicy();
      const parsed = JSON.parse(raw);
      return normalizeHipaaPolicy(parsed);
    } catch {
      return defaultHipaaPolicy();
    }
  }

  function saveHipaaPolicyLocal(policy) {
    hipaaPolicy = normalizeHipaaPolicy(policy, hipaaPolicy || defaultHipaaPolicy());
    try {
      localStorage.setItem(HIPAA_POLICY_KEY, JSON.stringify(hipaaPolicy));
    } catch {
      // no-op
    }
    renderHipaaPolicyForm();
    return hipaaPolicy;
  }

  function loadUserLabel() {
    try {
      return String(localStorage.getItem(USER_LABEL_KEY) || "").trim();
    } catch {
      return "";
    }
  }

  function saveUserLabel(value) {
    const normalized = String(value || "").trim().slice(0, 80);
    try {
      if (normalized) localStorage.setItem(USER_LABEL_KEY, normalized);
      else localStorage.removeItem(USER_LABEL_KEY);
    } catch {
      // no-op
    }
    if (els.settingsUserLabel) els.settingsUserLabel.value = normalized;
    return normalized;
  }

  function resolveAuditActor() {
    if (authState && authState.username) return authState.username;
    const direct = String(window.WOUND_HISTORY_ACTOR || "").trim();
    if (direct) return direct;
    const savedLabel = loadUserLabel();
    if (savedLabel) return savedLabel;
    const localActor = String(window.WOUND_PROVIDER_LABEL || "").trim();
    if (localActor) return localActor;
    return "";
  }

  let localAuditLog = [];
  let offlineAuditQueue = [];

  async function sendAuditEventToServer(entry) {
    try {
      const res = await fetch("/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
        keepalive: true,
      });
      /* 202 = service worker queued-ok response (offline) */
      if (res.status === 202) {
        offlineAuditQueue.push(entry);
      }
    } catch {
      /* Network offline: queue for later */
      offlineAuditQueue.push(entry);
    }
  }

  async function flushOfflineAuditQueue() {
    if (!offlineAuditQueue.length) return;
    const pending = offlineAuditQueue.splice(0);
    for (const entry of pending) {
      try {
        await fetch("/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...entry, queued: true }),
        });
      } catch {
        offlineAuditQueue.unshift(entry); /* re-queue if still offline */
        break;
      }
    }
  }

  window.addEventListener("online", flushOfflineAuditQueue);

  async function fetchRemoteAuditLog() {
    try {
      const res = await fetch("/audit", { cache: "no-store" });
      if (res.status === 503) return { status: "kv_not_configured", data: null };
      if (res.status === 404) return { status: "not_deployed", data: null };
      if (!res.ok) return { status: "error", code: res.status, data: null };
      const data = await res.json();
      return { status: "ok", data: Array.isArray(data) ? data : [] };
    } catch (err) {
      const isLocal = window.location.protocol === "file:";
      return { status: isLocal ? "local_file" : "network_error", data: null };
    }
  }

  function loadLocalAuditEntries() {
    return localAuditLog.slice();
  }

  function saveLocalAuditEntries(entries) {
    /* Session-only: audit entries live in memory and clear when the page closes. */
    localAuditLog = Array.isArray(entries) ? entries.slice(0, AUDIT_LOG_LOCAL_LIMIT) : [];
  }

  function appendLocalAuditEntry(eventType, details = {}, source = "local") {
    const event = String(eventType || "").trim() || "event";
    const entry = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
      event_type: event,
      actor: resolveAuditActor() || "unknown-user",
      source,
      details: details && typeof details === "object" ? details : { note: String(details || "") },
    };
    const current = loadLocalAuditEntries();
    current.unshift(entry);
    saveLocalAuditEntries(current);
    /* Best-effort remote logging — fires and forgets */
    sendAuditEventToServer(entry);
    return entry;
  }

  function detailsToSummary(details) {
    if (!details || typeof details !== "object") return "";
    const candidates = [];
    if (Object.prototype.hasOwnProperty.call(details, "deleted_rows")) {
      candidates.push(`deleted ${details.deleted_rows}`);
    }
    if (Object.prototype.hasOwnProperty.call(details, "retention_days")) {
      candidates.push(`retention ${details.retention_days}d`);
    }
    if (Object.prototype.hasOwnProperty.call(details, "auto_purge_enabled")) {
      candidates.push(`auto purge ${details.auto_purge_enabled ? "on" : "off"}`);
    }
    if (Object.prototype.hasOwnProperty.call(details, "report_id")) {
      candidates.push(`report ${String(details.report_id)}`);
    }
    if (Object.prototype.hasOwnProperty.call(details, "facility")) {
      candidates.push(`facility ${String(details.facility)}`);
    }
    if (!candidates.length) {
      const raw = JSON.stringify(details);
      return raw.length > 160 ? `${raw.slice(0, 157)}...` : raw;
    }
    return candidates.join("; ");
  }

  function renderHipaaPolicyForm() {
    const policy = normalizeHipaaPolicy(hipaaPolicy || defaultHipaaPolicy());
    hipaaPolicy = policy;
    if (els.hipaaRetentionDays) els.hipaaRetentionDays.value = String(policy.retention_days);
    if (els.hipaaAutoPurge) els.hipaaAutoPurge.checked = Boolean(policy.auto_purge_enabled);
    if (els.hipaaPolicyInfo) {
      const source = policy.source || "local-default";
      const updatedAt = policy.updated_at ? policy.updated_at.replace("T", " ").replace("Z", " UTC") : "not yet updated";
      const updatedBy = policy.updated_by || "local";
      els.hipaaPolicyInfo.textContent = `Policy source: ${source}. Last update: ${updatedAt} by ${updatedBy}.`;
    }
  }

  function readHipaaPolicyFromForm() {
    const current = normalizeHipaaPolicy(hipaaPolicy || defaultHipaaPolicy());
    return normalizeHipaaPolicy({
      retention_days: els.hipaaRetentionDays ? els.hipaaRetentionDays.value : current.retention_days,
      auto_purge_enabled: els.hipaaAutoPurge ? els.hipaaAutoPurge.checked : current.auto_purge_enabled,
      source: current.source,
      updated_at: new Date().toISOString(),
      updated_by: resolveAuditActor(),
    }, current);
  }

  function formatAuditTimestamp(isoString) {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString("en-US", {
        timeZone: "America/New_York",
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }) + " ET";
    } catch {
      return isoString;
    }
  }

  function renderAuditLog(entries = [], sourceLabel = "local browser") {
    const list = Array.isArray(entries) ? entries : [];
    if (els.auditLogMeta) {
      els.auditLogMeta.textContent = `Log source: ${sourceLabel}`;
    }

    if (els.auditLogHead) {
      els.auditLogHead.innerHTML = "<tr><th>Date / Time (ET)</th><th>Source</th><th>Event</th><th>Actor</th><th>Summary</th></tr>";
    }

    if (els.auditLogSummary) {
      const eventTypes = new Set(list.map((x) => String(x?.event_type || "").trim()).filter(Boolean));
      const last = list[0]?.server_ts || list[0]?.created_at || "";
      const cards = [
        { label: "Rows", value: list.length },
        { label: "Event Types", value: eventTypes.size },
        { label: "Latest Event", value: last ? formatAuditTimestamp(last) : "none" },
        { label: "Rendered At", value: formatAuditTimestamp(new Date().toISOString()) },
      ];
      els.auditLogSummary.innerHTML = cards
        .map((item) => `<div class="audit-summary-card"><span class="label">${escapeHtml(item.label)}</span><span class="value">${escapeHtml(String(item.value))}</span></div>`)
        .join("");
    }

    if (!els.auditLogBody) return;
    if (!list.length) {
      els.auditLogBody.innerHTML = "<tr><td colspan=\"5\">No audit events recorded yet.</td></tr>";
      return;
    }

    els.auditLogBody.innerHTML = list.map((entry) => {
      const ts = entry?.server_ts || entry?.created_at || "";
      const source = String(entry?.source || "local");
      const eventType = String(entry?.event_type || "");
      const actor = String(entry?.actor || "");
      const summary = detailsToSummary(entry?.details || {});
      return `<tr><td>${escapeHtml(formatAuditTimestamp(ts))}</td><td>${escapeHtml(source)}</td><td>${escapeHtml(eventType)}</td><td>${escapeHtml(actor)}</td><td>${escapeHtml(summary)}</td></tr>`;
    }).join("");
  }

  function resolveHistoryApiBase() {
    const fromGlobal = normalizeHistoryApiBase(window.WOUND_HISTORY_API_BASE);
    if (fromGlobal) return fromGlobal;

    const fromConstant = normalizeHistoryApiBase(HISTORY_API_BASE);
    if (fromConstant) return fromConstant;

    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
      return normalizeHistoryApiBase(window.location.origin);
    }

    return "";
  }

  function resolveHistoryApiToken() {
    const fromGlobal = normalizeHistoryApiToken(window.WOUND_HISTORY_API_TOKEN);
    if (fromGlobal) return fromGlobal;
    return normalizeHistoryApiToken(HISTORY_API_TOKEN);
  }

  function resolveHistoryApiUseAccessJwt() {
    if (Object.prototype.hasOwnProperty.call(window, "WOUND_HISTORY_USE_ACCESS_JWT")) {
      return normalizeBoolean(window.WOUND_HISTORY_USE_ACCESS_JWT, false);
    }
    return normalizeBoolean(HISTORY_API_USE_ACCESS_JWT, false);
  }

  function isCloudHistoryConfigured() {
    if (!historyApiBase) return false;
    if (historyApiToken) return true;
    return historyApiUseAccessJwt;
  }

  function getHistoryScopeLabel(mode = "local") {
    if (mode === "cloud") {
      if (shouldPersistLocalHistory()) return `cloud server (${historyApiBase}) + browser backup`;
      return `cloud server (${historyApiBase})`;
    }
    if (mode === "fallback") {
      if (!shouldPersistLocalHistory()) return "cloud unavailable (no local backup configured)";
      return "local browser storage (cloud unavailable)";
    }
    return "local browser storage";
  }

  function setHistoryScope(mode = "local") {
    if (!els.historyDir) return;
    els.historyDir.value = getHistoryScopeLabel(mode);
  }

  function shouldPersistLocalHistory() {
    return false;
  }

  function buildHistoryApiUrl(path) {
    if (!historyApiBase) return "";
    const base = normalizeHistoryApiBase(historyApiBase);
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    if (base.endsWith("/api")) return `${base}${cleanPath}`;
    return `${base}/api${cleanPath}`;
  }

  async function postJsonWithTimeout(url, payload, timeoutMs = 6000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const actorHeader = resolveAuditActor();
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(historyApiToken ? { Authorization: `Bearer ${historyApiToken}` } : {}),
          ...(actorHeader ? { "X-History-Actor": actorHeader } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const text = await res.text();
      let data = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`Invalid JSON from history API (${res.status}).`);
        }
      }

      if (!res.ok) {
        const msg = data?.error || `${res.status} ${res.statusText}`.trim();
        throw new Error(msg || "History API request failed.");
      }
      return data;
    } catch (err) {
      if (err?.name === "AbortError") throw new Error("History API timed out.");
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  function normalizeSupplyKey(value) {
    return normalizeText(value)
      .replace(/\([^)]*\)/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function classifySupplyGroup(entry) {
    const cat = normalizeText(entry.category);
    const option = normalizeText(entry.treatment_option);

    if (cat.includes("debridement")) return "Debridement Types";
    if (cat.includes("periwound")) return "Periwound";
    if (option.includes("cover") || option.includes("contact layer") || option.includes("transparent film") || option.includes("gauze")) {
      return "Covering / Securement";
    }
    if (
      cat.includes("moisture balance") ||
      cat.includes("high exudate") ||
      cat.includes("matrix / tissue support") ||
      cat.includes("autolytic / osmotic") ||
      cat.includes("hemostasis")
    ) {
      return "Dressings";
    }
    if (cat.includes("cleansing") || cat.includes("antiseptic")) return "Cleansing / Solutions";
    if (cat.includes("antimicrobial")) return "Antimicrobial";
    if (
      cat.includes("pressure management") ||
      cat.includes("offloading") ||
      cat.includes("venous ulcer") ||
      cat.includes("arterial")
    ) {
      return "Offloading / Compression";
    }
    if (cat.includes("negative pressure") || cat.includes("adjunctive oxygen") || cat.includes("grafting")) return "Advanced Therapies";
    if (cat.includes("nutrition") || cat.includes("lifestyle") || cat.includes("pain")) return "Systemic / Supportive";
    if (cat.includes("assessment") || cat.includes("infection management") || cat.includes("surgical")) return "Escalation / Surgical";
    return "Other";
  }

  function isSupplyOptionExcluded(entry) {
    const cat = normalizeText(entry.category);
    const option = normalizeText(entry.treatment_option);

    const isSkinSubstitute =
      cat.includes("grafting / cellular products") ||
      option.includes("skin substitute") ||
      option.includes("cellular/tissue-based") ||
      option.includes("ctp") ||
      option.includes("placental") ||
      option.includes("amniotic") ||
      option.includes("allograft");

    const isBiologicDebridement =
      option.includes("biologic debridement") ||
      option.includes("sterile larval");

    const isAdvancedTherapy =
      cat.includes("negative pressure") ||
      cat.includes("adjunctive oxygen") ||
      cat.includes("grafting / cellular products") ||
      cat.includes("extended options") ||
      cat.includes("surgical reconstruction") ||
      option.includes("npwt") ||
      option.includes("hyperbaric") ||
      option.includes("topical oxygen") ||
      option.includes("electrical stimulation") ||
      option.includes("hydrosurgical") ||
      option.includes("venous duplex") ||
      option.includes("endovenous ablation");

    return isSkinSubstitute || isBiologicDebridement || isAdvancedTherapy;
  }

  function buildSupplyEntries() {
    return TREATMENT_CATALOG
      .filter((entry) => !isSupplyOptionExcluded(entry))
      .map((entry) => ({
      key: normalizeSupplyKey(entry.treatment_option),
      label: entry.treatment_option,
      group: classifySupplyGroup(entry),
      sourceCategory: entry.category,
    }))
      .filter((entry, idx, arr) => arr.findIndex((x) => x.key === entry.key) === idx)
      .sort((a, b) => {
        const ga = SUPPLY_GROUP_ORDER.indexOf(a.group);
        const gb = SUPPLY_GROUP_ORDER.indexOf(b.group);
        if (ga !== gb) return ga - gb;
        return a.label.localeCompare(b.label);
      });
  }

  function loadSupplyPrefs() {
    try {
      const raw = localStorage.getItem(SUPPLY_PREF_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      return new Set(parsed.filter((x) => typeof x === "string"));
    } catch {
      return null;
    }
  }

  function saveSupplyPrefs() {
    localStorage.setItem(SUPPLY_PREF_KEY, JSON.stringify(Array.from(selectedSupplyKeys)));
  }


  function defaultRerunOverrideStore() {
    return { version: 1, items: {} };
  }

  function loadRerunOverrideStore() {
    /* Session-only: no localStorage read to prevent any PHI retrieval. */
    return defaultRerunOverrideStore();
  }

  function saveRerunOverrideStore() {
    /* No-op: override store is session-only to prevent PHI storage. */
  }

  function buildWoundOverrideStorageKey(recordLike) {
    const mrn = normalizeText(recordLike?.mrn || "");
    const name = normalizeText(recordLike?.name || "");
    const woundNumber = normalizeText(recordLike?.wound_number || "");
    const location = normalizeText(recordLike?.location || "");
    const woundType = normalizeText(recordLike?.wound_type || "");
    const stage = normalizeText(recordLike?.stage || "");
    const personKey = mrn || name || "unknown-patient";

    if (woundNumber || location) {
      return [personKey, woundNumber || "no-wound-number", location || "no-location"].join("|");
    }

    return [personKey, "no-wound-number", "no-location", woundType || "no-type", stage || "no-stage"].join("|");
  }

  function getStoredManualOverrides(recordLike) {
    const key = buildWoundOverrideStorageKey(recordLike);
    const stored = rerunOverrideStore?.items?.[key];
    if (!stored) return null;
    const normalized = normalizeManualOverrides(stored);
    return hasAnyManualOverride(normalized) ? normalized : null;
  }

  function setStoredManualOverrides(_recordLike, _overrides) {
    /* No-op: clinical overrides are not persisted to prevent PHI storage. */
  }

  function renderPhraseEditor() {
    if (!els.phraseFields) return;
    els.phraseFields.innerHTML = NARRATIVE_PHRASE_FIELDS.map((field) => {
      const value = getNarrativePhrase(field.key);
      const id = `phrase_${slugify(field.key)}`;
      return `
        <div class="phrase-field">
          <label for="${escapeHtml(id)}">${escapeHtml(field.label)}</label>
          <textarea id="${escapeHtml(id)}" data-phrase-key="${escapeHtml(field.key)}">${escapeHtml(value)}</textarea>
          <p class="phrase-help">${escapeHtml(field.help || "")}</p>
        </div>
      `;
    }).join("");
  }

  function collectPhraseEditorValues() {
    const out = {};
    if (!els.phraseFields) return out;
    els.phraseFields.querySelectorAll("textarea[data-phrase-key]").forEach((textarea) => {
      const key = textarea.getAttribute("data-phrase-key");
      if (!key) return;
      out[key] = textarea.value;
    });
    return sanitizeNarrativePhraseOverrides(out);
  }

  function rerenderNarrative() {
    if (!latestOutputs || !Array.isArray(latestOutputs.detailedRows)) return;
    els.narrativeText.innerHTML = buildChartNarrative(latestOutputs.detailedRows, narrativeStyle);
  }

  function ensureDeviceDebridementSuppliesSelected() {
    try {
      if (localStorage.getItem(SUPPLY_PREF_DEVICE_MIGRATION_KEY) === "1") return;
    } catch {
      return;
    }

    let changed = false;
    for (const entry of supplyEntries) {
      const key = normalizeText(entry.key);
      if (key.includes("xsonx") || key.includes("arobella")) {
        if (!selectedSupplyKeys.has(entry.key)) {
          selectedSupplyKeys.add(entry.key);
          changed = true;
        }
      }
    }
    if (changed) saveSupplyPrefs();
    try {
      localStorage.setItem(SUPPLY_PREF_DEVICE_MIGRATION_KEY, "1");
    } catch {
      // no-op
    }
  }

  function renderSuppliesPanel() {
    const groups = new Map();
    SUPPLY_GROUP_ORDER.forEach((g) => groups.set(g, []));
    supplyEntries.forEach((entry) => {
      if (!groups.has(entry.group)) groups.set(entry.group, []);
      groups.get(entry.group).push(entry);
    });

    const blocks = [];
    for (const [groupName, entries] of groups.entries()) {
      if (!entries.length) continue;
      const optionsHtml = entries
        .map((entry) => {
          const checkboxId = `supply_${slugify(entry.key)}`;
          const checked = selectedSupplyKeys.has(entry.key) ? "checked" : "";
          return `<label class="supply-option" for="${escapeHtml(checkboxId)}"><input type="checkbox" id="${escapeHtml(checkboxId)}" data-supply-key="${escapeHtml(entry.key)}" ${checked} /><span>${escapeHtml(entry.label)}</span></label>`;
        })
        .join("");
      blocks.push(`<section class="supply-group"><h3>${escapeHtml(groupName)}</h3>${optionsHtml}</section>`);
    }

    els.suppliesList.innerHTML = blocks.join("");

    els.suppliesList.querySelectorAll("input[type=checkbox][data-supply-key]").forEach((cb) => {
      cb.addEventListener("change", (e) => {
        const key = e.target.getAttribute("data-supply-key");
        if (!key) return;
        if (e.target.checked) selectedSupplyKeys.add(key);
        else selectedSupplyKeys.delete(key);
        saveSupplyPrefs();
        setStatus("Supplies filter updated. Re-run analysis to apply changes.");
      });
    });
  }

  function setAllSupplies(checked) {
    selectedSupplyKeys = new Set(checked ? supplyEntries.map((entry) => entry.key) : []);
    saveSupplyPrefs();
    renderSuppliesPanel();
  }

  function recalculateCurrentOutputRowsFromSources() {
    if (!latestOutputs || !Array.isArray(latestOutputs.detailedRows) || !latestOutputs.detailedRows.length) return false;

    const rebuiltRows = latestOutputs.detailedRows.map((row) => {
      const latest = row?._latest_source;
      if (!latest) return row;

      const previous = row?._previous_source || null;
      const woundRecords = (Array.isArray(row?._wound_records_source) && row._wound_records_source.length)
        ? row._wound_records_source
        : [previous, latest].filter(Boolean);
      const timelinePoints = Array.isArray(row?._timeline_points_source) ? row._timeline_points_source : [];
      const currentTimelineIndex = Number.isInteger(row?._timeline_current_index)
        ? row._timeline_current_index
        : findCurrentTimelineIndex(timelinePoints, latest);
      const manualOverrides = getStoredManualOverrides(row || latest);
      return buildDetailedRow(latest, previous, woundRecords, manualOverrides, timelinePoints, currentTimelineIndex);
    });

    applyPriorComparison(
      rebuiltRows,
      latestOutputs.historicalSnapshots || [],
      latestOutputs.priorSnapshot || null,
    );

    latestOutputs.detailedRows = rebuiltRows;
    latestOutputs.rows = buildDisplayRows(rebuiltRows);

    renderPreview(
      Object.keys(latestOutputs.rows[0] || {}),
      latestOutputs.rows,
      latestOutputs.detailedRows,
    );
    rerenderNarrative();
    return true;
  }

  function resetSuppliesSetting() {
    selectedSupplyKeys = new Set(supplyEntries.map((entry) => entry.key));
    saveSupplyPrefs();
    renderSuppliesPanel();
    recalculateCurrentOutputRowsFromSources();
  }

  function resetNarrativePhraseSetting() {
    narrativePhraseOverrides = {};
    saveNarrativePhraseOverrides();
    renderPhraseEditor();
    rerenderNarrative();
  }

  function resetNarrativeStyleSetting() {
    saveNarrativeStyle(DEFAULT_NARRATIVE_STYLE);
    if (els.narrativeStyle) els.narrativeStyle.value = narrativeStyle;
    rerenderNarrative();
  }

  function resetRerunOverridesSetting() {
    rerunOverrideStore = defaultRerunOverrideStore();
    saveRerunOverrideStore();
    recalculateCurrentOutputRowsFromSources();
  }

  function resetLocalHistorySetting() {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // no-op
    }
    appendLocalAuditEntry("history_reset_local", { deleted_rows: "all_local_history" }, "local");
  }

  function getHistoryEntryAnchorDate(reportEntry) {
    const end = toIsoDate(reportEntry?.report_end_date);
    if (end) return end;
    const generated = toIsoDate(reportEntry?.generated_at);
    if (generated) return generated;
    return "";
  }

  function purgeLocalHistoryByPolicy(policy, reason = "manual") {
    const currentPolicy = normalizeHipaaPolicy(policy || hipaaPolicy || defaultHipaaPolicy());
    const cutoffDate = new Date(Date.now() - currentPolicy.retention_days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const history = loadHistory();
    let deletedRows = 0;

    const facilities = history?.facilities && typeof history.facilities === "object" ? history.facilities : {};
    Object.keys(facilities).forEach((facilityKey) => {
      const facility = facilities[facilityKey];
      if (!facility || !Array.isArray(facility.reports)) return;

      const keepReports = [];
      const keepReportIds = new Set();

      facility.reports.forEach((report) => {
        const anchor = getHistoryEntryAnchorDate(report);
        const shouldKeep = !anchor || anchor >= cutoffDate;
        if (shouldKeep) {
          keepReports.push(report);
          if (report?.report_id) keepReportIds.add(String(report.report_id));
        } else {
          deletedRows += 1;
        }
      });

      facility.reports = keepReports;
      const nextSnapshots = {};
      const snapshots = facility?.snapshots && typeof facility.snapshots === "object" ? facility.snapshots : {};
      keepReportIds.forEach((reportId) => {
        if (snapshots[reportId]) nextSnapshots[reportId] = snapshots[reportId];
      });
      facility.snapshots = nextSnapshots;
    });

    saveHistory(history);
    appendLocalAuditEntry("history_purge", {
      deleted_rows: deletedRows,
      retention_days: currentPolicy.retention_days,
      auto_purge_enabled: currentPolicy.auto_purge_enabled,
      reason,
    }, "local");

    return deletedRows;
  }

  async function fetchHipaaPolicyFromCloud() {
    const url = buildHistoryApiUrl(HISTORY_ADMIN_POLICY_GET_PATH);
    if (!url) throw new Error("Cloud history API is not configured.");
    const response = await postJsonWithTimeout(url, {}, 10000);
    if (!response || response.ok !== true || !response.policy) {
      throw new Error(response?.error || "Cloud HIPAA policy read failed.");
    }
    return normalizeHipaaPolicy({
      ...response.policy,
      source: response.policy.source || "cloud",
    });
  }

  async function saveHipaaPolicyToCloud(policy, password) {
    const url = buildHistoryApiUrl(HISTORY_ADMIN_POLICY_SET_PATH);
    if (!url) throw new Error("Cloud history API is not configured.");
    const payload = {
      password: String(password || ""),
      retention_days: normalizeRetentionDays(policy?.retention_days, HIPAA_DEFAULT_RETENTION_DAYS),
      auto_purge_enabled: normalizeBoolean(policy?.auto_purge_enabled, true),
    };
    const response = await postJsonWithTimeout(url, payload, 12000);
    if (!response || response.ok !== true || !response.policy) {
      throw new Error(response?.error || "Cloud HIPAA policy save failed.");
    }
    return normalizeHipaaPolicy({
      ...response.policy,
      source: "cloud",
    });
  }

  async function runCloudPurge(password) {
    const url = buildHistoryApiUrl(HISTORY_PURGE_PATH);
    if (!url) throw new Error("Cloud history API is not configured.");
    const response = await postJsonWithTimeout(url, { password: String(password || "") }, 15000);
    if (!response || response.ok !== true || !response.purge) {
      throw new Error(response?.error || "Cloud purge failed.");
    }
    return response.purge;
  }

  async function fetchCloudAuditEntries(limit = DEFAULT_AUDIT_FETCH_LIMIT) {
    const url = buildHistoryApiUrl(HISTORY_AUDIT_LOG_PATH);
    if (!url) throw new Error("Cloud history API is not configured.");
    const response = await postJsonWithTimeout(url, { limit }, 12000);
    if (!response || response.ok !== true) {
      throw new Error(response?.error || "Cloud audit log fetch failed.");
    }
    const entries = Array.isArray(response.entries) ? response.entries : [];
    return entries.map((entry) => ({
      id: entry.id,
      created_at: String(entry.created_at || ""),
      event_type: String(entry.event_type || ""),
      actor: String(entry.actor || ""),
      details: entry.details && typeof entry.details === "object" ? entry.details : {},
      source: "cloud",
    }));
  }

  async function sendUsageEventToCloud(eventType, details = {}) {
    if (!isCloudHistoryConfigured()) return false;
    const url = buildHistoryApiUrl(HISTORY_USAGE_EVENT_PATH);
    if (!url) return false;
    const safeEvent = String(eventType || "").trim() || "usage_event";
    const safeDetails = details && typeof details === "object" ? details : { note: String(details || "") };
    try {
      const response = await postJsonWithTimeout(url, { event_type: safeEvent, details: safeDetails }, 7000);
      return Boolean(response?.ok);
    } catch (err) {
      console.warn("Cloud usage event logging failed.", err);
      return false;
    }
  }

  function logUsageEvent(eventType, details = {}, options = {}) {
    const safeEvent = String(eventType || "").trim() || "usage_event";
    const safeDetails = details && typeof details === "object" ? details : { note: String(details || "") };
    const useLocal = options.local !== false;
    const useCloud = options.cloud !== false;

    if (useLocal) {
      appendLocalAuditEntry(safeEvent, safeDetails, isCloudHistoryConfigured() ? "cloud+local" : "local");
    }
    if (useCloud && isCloudHistoryConfigured()) {
      void sendUsageEventToCloud(safeEvent, safeDetails);
    }
  }

  function clearAppLocalStorageData() {
    const keys = new Set(APP_LOCAL_STORAGE_KEYS);
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (typeof key === "string" && key.startsWith("OW_")) keys.add(key);
      }
    } catch {
      // no-op
    }

    keys.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // no-op
      }
    });
  }

  function clearRunOutputUi() {
    latestOutputs = null;

    els.previewHead.innerHTML = "";
    els.previewBody.innerHTML = "";
    els.narrativeText.innerHTML = '<p class="narrative-empty">Generate considerations to create chart narratives.</p>';

    els.narrativePanel.classList.add("hidden");
    els.previewPanel.classList.add("hidden");
    if (els.auditLogPanel) els.auditLogPanel.classList.add("hidden");
    exitPrintPacketMode();
  }

  function applyDefaultSettingsInMemory() {
    selectedSupplyKeys = new Set(supplyEntries.map((entry) => entry.key));
    rerunOverrideStore = defaultRerunOverrideStore();
    narrativeStyle = DEFAULT_NARRATIVE_STYLE;
    narrativePhraseOverrides = {};
    hipaaPolicy = defaultHipaaPolicy();

    if (els.narrativeStyle) els.narrativeStyle.value = narrativeStyle;
    renderSuppliesPanel();
    renderPhraseEditor();
    rerenderNarrative();
    renderHipaaPolicyForm();
    renderAuditLog(loadLocalAuditEntries(), "local browser");
  }

  async function runMasterReset(password) {
    const hasCloudHistory = isCloudHistoryConfigured();
    let deletedRows = 0;

    if (hasCloudHistory) {
      const response = await postJsonWithTimeout(buildHistoryApiUrl(HISTORY_RESET_ALL_PATH), { password }, 12000);
      if (!response || response.ok !== true) {
        throw new Error(response?.error || "Cloud history reset failed.");
      }
      deletedRows = Number(response.deleted_rows || 0);
    }

    clearAppLocalStorageData();
    clearRunOutputUi();
    applyDefaultSettingsInMemory();
    appendLocalAuditEntry("master_reset", {
      has_cloud_history: hasCloudHistory,
      deleted_rows: deletedRows,
    }, hasCloudHistory ? "cloud+local" : "local");
    setHistoryScope(hasCloudHistory ? "cloud" : "local");
    return { hasCloudHistory, deletedRows };
  }

  function resolveSuggestionSupplyKey(optionText) {
    const text = normalizeSupplyKey(optionText);
    const byDirect = supplyEntries.find((entry) => text.includes(entry.key) || entry.key.includes(text));
    if (byDirect) return byDirect.key;

    const keywordMap = [
      { k: "sharp surgical debridement", q: "sharp" },
      { k: "xsonx wound hygiene debridement system", q: "xsonx" },
      { k: "arobella qoustic wound therapy system", q: "arobella" },
      { k: "enzymatic debridement santyl collagenase", q: "santyl" },
      { k: "dakin solution", q: "dakin" },
      { k: "normal saline irrigation", q: "normal saline" },
      { k: "hydrofera blue methylene blue gentian violet foam", q: "hydrofera" },
      { k: "silver dressing", q: "silver containing dressing" },
      { k: "medihoney gel paste sheets alginate variants", q: "medihoney" },
      { k: "calcium alginate dressing", q: "calcium alginate" },
      { k: "collagen dressing", q: "collagen dressing" },
      { k: "skin barrier film barrier ointment", q: "skin barrier" },
      { k: "silicone contact layer", q: "silicone contact layer" },
      { k: "intralesional triamcinolone acetonide 10 mg ml hs nodules and pg inflammatory lesions", q: "intralesional triamcinolone" },
      { k: "topical clindamycin 1 solution hidradenitis suppurativa hurley i ii", q: "topical clindamycin" },
      { k: "zinc gluconate 90mg day hidradenitis suppurativa anti inflammatory adjunct", q: "zinc gluconate" },
      { k: "non perfumed emollient radiation dermatitis skin care", q: "emollient" },
      { k: "pentoxifylline 400mg tid vitamin e 1000 iu day radiation fibrosis and orn adjunct", q: "pentoxifylline" },
      { k: "wound closure strips skin closure tape superficial wound edge approximation", q: "wound closure strips" },
      { k: "chlorhexidine 0 05 wound irrigation hs sinus tracts and inflammatory wounds", q: "chlorhexidine 0.05" },
      { k: "hydrocolloid dressing for stsg donor site first 3 7 days", q: "donor site" },
      { k: "bolster tie over pressure dressing stsg recipient site immobilization", q: "bolster" },
    ];

    const hit = keywordMap.find((x) => text.includes(x.q));
    if (!hit) return null;
    const mapped = supplyEntries.find((entry) => entry.key.includes(hit.k) || hit.k.includes(entry.key));
    return mapped ? mapped.key : null;
  }

  function isSuggestionEnabled(optionText) {
    const supplyKey = resolveSuggestionSupplyKey(optionText);
    if (!supplyKey) return true;
    return selectedSupplyKeys.has(supplyKey);
  }

  function parseDate(value) {
    if (value == null || value === "") return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return new Date(value);

    if (typeof value === "number" && Number.isFinite(value)) {
      const base = Date.UTC(1899, 11, 30);
      const millis = Math.round(value * 24 * 60 * 60 * 1000);
      const dt = new Date(base + millis);
      return Number.isNaN(dt.getTime()) ? null : dt;
    }

    const text = String(value).trim();
    const mmddyyyy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (mmddyyyy) {
      let year = Number(mmddyyyy[3]);
      if (year < 100) year += 2000;
      const d = new Date(year, Number(mmddyyyy[1]) - 1, Number(mmddyyyy[2]));
      return Number.isNaN(d.getTime()) ? null : d;
    }

    const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso) {
      const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
      return Number.isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(text);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function toIsoDate(value) {
    const d = parseDate(value);
    if (!d) return "";
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
  }

  function parseDateRangeText(value) {
    if (value == null) return [null, null];
    const text = String(value).trim();
    const m = DATE_RANGE_RE.exec(text);
    if (!m) return [null, null];
    return [parseDate(m[1]), parseDate(m[2])];
  }

  function parsePercentRange(value) {
    const text = normalizeText(value);
    if (!text || text === "none" || text === "nan") return 0;
    let m = text.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*%/);
    if (m) return (Number(m[1]) + Number(m[2])) / 2;
    m = text.match(/(\d+(?:\.\d+)?)\s*%/);
    if (m) return Number(m[1]);
    return 0;
  }

  function hasDocumentedCell(value) {
    if (value == null) return false;
    return String(value).trim() !== "";
  }

  function isRepeatedHeaderRow(nameValue, mrnValue) {
    const name = normalizeText(nameValue);
    const mrn = normalizeText(mrnValue);
    if (!name && !mrn) return false;
    const nameLooksHeader =
      name === "name" ||
      name === "patient name" ||
      name === "resident name";
    const mrnLooksHeader =
      mrn === "mrn" ||
      mrn === "medical record number" ||
      mrn === "medical record";
    return nameLooksHeader && mrnLooksHeader;
  }

  function rowHasWoundSignal(row, idx) {
    const fields = [
      idx.wound_number,
      idx.wound_type,
      idx.assessment_date,
      idx.stage,
      idx.location,
      idx.size_cm,
      idx.status,
      idx.slough,
      idx.eschar,
      idx.epithelialization,
      idx.granulation,
    ];

    for (const colIdx of fields) {
      if (colIdx == null) continue;
      const value = row[colIdx];
      if (value != null && String(value).trim() !== "") return true;
    }
    return false;
  }

  function parseSize(value) {
    if (value == null) return [0, 0, 0];
    if (typeof value === "number" && Number.isFinite(value)) return [value, 0, 0];
    const text = String(value).trim();
    if (!text) return [0, 0, 0];
    const parts = text.split(",").map((p) => p.trim());
    const nums = [];
    for (let i = 0; i < 3; i += 1) {
      const v = Number(parts[i] || 0);
      nums.push(Number.isFinite(v) ? v : 0);
    }
    return nums;
  }

  function stageScore(stage) {
    const text = normalizeText(stage);
    if (text.includes("unstageable")) return 5;
    if (text.includes("deep tissue")) return 4;
    const m = text.match(/stage\s*(\d+)/);
    return m ? Number(m[1]) : 0;
  }

  function findHeaderRow(grid) {
    const required = new Set(["name", "mrn", "wnd #", "date", "location", "current wound status"]);
    for (let r = 0; r < Math.min(60, grid.length); r += 1) {
      const norm = new Set(
        (grid[r] || [])
          .map((v) => normalizeText(v))
          .filter(Boolean)
      );
      let ok = true;
      required.forEach((t) => {
        if (!norm.has(t)) ok = false;
      });
      if (ok) return r;
    }
    return -1;
  }

  function resolveHeaderIndexes(headerRow) {
    const map = new Map();
    headerRow.forEach((h, i) => {
      const key = canonicalHeader(h);
      if (key && !map.has(key)) map.set(key, i);
    });

    const firstIndex = (candidates, fallback = null) => {
      for (const c of candidates) {
        if (map.has(c)) return map.get(c);
      }
      return fallback;
    };

    return {
      name: firstIndex(["name"], 0),
      mrn: firstIndex(["mrn"], 1),
      wound_number: firstIndex(["wnd #", "wnd", "wnd num", "wnd number"], 2),
      wound_type: firstIndex(["wound type", "type"], null),
      assessment_date: firstIndex(["date"], 3),
      stage: firstIndex(["stage"], 5),
      location: firstIndex(["location"], 6),
      acquired_at_facility: firstIndex(["acquired at facility"], 7),
      size_cm: firstIndex(["size l w d cm", "size cm", "size"], 9),
      date_acquired: firstIndex(["date acquired"], 10),
      admission_date: firstIndex(["admission date"], 11),
      discharge_date: firstIndex(["discharge date"], 13),
      status: firstIndex(["current wound status"], 14),
      slough: firstIndex(["slough"], 15),
      eschar: firstIndex(["eschar"], 16),
      epithelialization: firstIndex(["epithialization", "epithelialization"], 17),
      granulation: firstIndex(["red granulation"], 18),
      exudate_amount: firstIndex(["exudate amount", "drainage amount", "drainage amt", "amount drainage", "amount of drainage"], null),
      exudate_type: firstIndex(["exudate type", "drainage type", "character of drainage", "drainage character"], null),
      odor: firstIndex(["odor", "odour", "wound odor", "wound odour", "smell"], null),
      tunneling: firstIndex(["tunneling", "tunnelling", "tunnel", "sinus tract"], null),
      undermining: firstIndex(["undermining", "undermine"], null),
      exposed_structures: firstIndex(["exposed structures", "exposed structure", "structure exposed"], null),
      infection_signs: firstIndex(["signs of infection", "infection signs", "clinical signs infection", "local infection signs"], null),
      peri_wound: firstIndex(["peri wound", "periwound", "peri-wound"], null),
      pain: firstIndex(["pain", "wound pain"], null),
    };
  }

  function parseMetadata(grid) {
    const meta = {
      facility: "Unknown Facility",
      report_start_date: null,
      report_end_date: null,
    };

    for (let r = 0; r < Math.min(20, grid.length); r += 1) {
      for (const cell of grid[r] || []) {
        if (cell == null) continue;
        const text = String(cell).trim();
        if (text.toLowerCase().startsWith("facility:")) {
          const f = text.split(":").slice(1).join(":").trim();
          if (f) meta.facility = f;
        }
        const [start, end] = parseDateRangeText(text);
        if (start && end) {
          meta.report_start_date = start;
          meta.report_end_date = end;
        }
      }
    }
    return meta;
  }

  function dateDiffDays(a, b) {
    const ms = 24 * 60 * 60 * 1000;
    return Math.round((a.setHours(0,0,0,0) - b.setHours(0,0,0,0)) / ms);
  }

  function readRecordsFromWorkbook(workbook) {
    const meta = {
      facility: "Unknown Facility",
      report_start_date: null,
      report_end_date: null,
    };
    const records = [];
    const audit = {
      sheet_count: (workbook.SheetNames || []).length,
      sheets: [],
      totals: {
        rows_total: 0,
        rows_scanned: 0,
        parsed_rows: 0,
        skipped_blank_rows: 0,
        skipped_missing_patient: 0,
        skipped_no_wound_signal: 0,
        skipped_repeated_header: 0,
        skipped_no_header_sheet: 0,
      },
      warnings: [],
    };

    for (const sheetName of workbook.SheetNames || []) {
      const ws = workbook.Sheets[sheetName];
      if (!ws) {
        audit.sheets.push({
          sheet_name: sheetName,
          header_row_index: -1,
          rows_total: 0,
          rows_scanned: 0,
          parsed_rows: 0,
          skipped_blank_rows: 0,
          skipped_missing_patient: 0,
          skipped_no_wound_signal: 0,
          skipped_repeated_header: 0,
          note: "Worksheet not found in workbook object.",
        });
        audit.totals.skipped_no_header_sheet += 1;
        audit.warnings.push(`Sheet "${sheetName}" could not be read.`);
        continue;
      }
      const grid = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" });
      const sheetAudit = {
        sheet_name: sheetName,
        header_row_index: -1,
        rows_total: grid.length,
        rows_scanned: 0,
        parsed_rows: 0,
        skipped_blank_rows: 0,
        skipped_missing_patient: 0,
        skipped_no_wound_signal: 0,
        skipped_repeated_header: 0,
        note: "",
      };
      audit.totals.rows_total += grid.length;

      const sheetMeta = parseMetadata(grid);
      if (meta.facility === "Unknown Facility" && sheetMeta.facility && sheetMeta.facility !== "Unknown Facility") {
        meta.facility = sheetMeta.facility;
      }
      if (!meta.report_start_date && sheetMeta.report_start_date) meta.report_start_date = sheetMeta.report_start_date;
      if (!meta.report_end_date && sheetMeta.report_end_date) meta.report_end_date = sheetMeta.report_end_date;

      const headerRowIdx = findHeaderRow(grid);
      sheetAudit.header_row_index = headerRowIdx;
      if (headerRowIdx < 0) {
        sheetAudit.note = "Header row not found; sheet skipped.";
        audit.totals.skipped_no_header_sheet += 1;
        audit.warnings.push(`Sheet "${sheetName}" was skipped because no valid header row was found.`);
        audit.sheets.push(sheetAudit);
        continue;
      }

      const headerRow = grid[headerRowIdx] || [];
      const idx = resolveHeaderIndexes(headerRow);

      let lastName = "";
      let lastMrn = "";

      for (let r = headerRowIdx + 1; r < grid.length; r += 1) {
        sheetAudit.rows_scanned += 1;
        audit.totals.rows_scanned += 1;

        const row = grid[r] || [];
        if (!row.some((v) => v != null && String(v).trim() !== "")) {
          sheetAudit.skipped_blank_rows += 1;
          audit.totals.skipped_blank_rows += 1;
          continue;
        }

        const rawName = row[idx.name];
        const rawMrn = row[idx.mrn];
        const nameText = rawName != null ? String(rawName).trim() : "";
        const mrnText = rawMrn != null ? String(rawMrn).trim() : "";

        if (isRepeatedHeaderRow(nameText, mrnText)) {
          sheetAudit.skipped_repeated_header += 1;
          audit.totals.skipped_repeated_header += 1;
          continue;
        }

        if (nameText && normalizeText(nameText) !== "name") lastName = nameText;
        if (mrnText && normalizeText(mrnText) !== "mrn") lastMrn = mrnText;

        const effectiveName = nameText || lastName;
        const effectiveMrn = mrnText || lastMrn;
        if (!effectiveName || !effectiveMrn) {
          sheetAudit.skipped_missing_patient += 1;
          audit.totals.skipped_missing_patient += 1;
          continue;
        }
        if (!rowHasWoundSignal(row, idx)) {
          sheetAudit.skipped_no_wound_signal += 1;
          audit.totals.skipped_no_wound_signal += 1;
          continue;
        }

        const assessmentDate = parseDate(row[idx.assessment_date]);
        const sizeRaw = row[idx.size_cm];
        const statusRaw = row[idx.status];
        const [length_cm, width_cm, depth_cm] = parseSize(sizeRaw);
        const area_cm2 = Number((length_cm * width_cm).toFixed(2));
        const sloughRaw = row[idx.slough];
        const escharRaw = row[idx.eschar];
        const epithelializationRaw = row[idx.epithelialization];
        const granulationRaw = row[idx.granulation];
        const exudateAmountRaw = idx.exudate_amount != null ? row[idx.exudate_amount] : null;
        const exudateTypeRaw = idx.exudate_type != null ? row[idx.exudate_type] : null;
        const odorRaw = idx.odor != null ? row[idx.odor] : null;
        const tunnelingRaw = idx.tunneling != null ? row[idx.tunneling] : null;
        const underminingRaw = idx.undermining != null ? row[idx.undermining] : null;
        const exposedStructuresRaw = idx.exposed_structures != null ? row[idx.exposed_structures] : null;
        const infectionSignsRaw = idx.infection_signs != null ? row[idx.infection_signs] : null;
        const periWoundRaw = idx.peri_wound != null ? row[idx.peri_wound] : null;
        const painRaw = idx.pain != null ? row[idx.pain] : null;

        const rec = {
          name: normalizePersonName(String(effectiveName).trim()),
          mrn: String(effectiveMrn).trim(),
          wound_number: row[idx.wound_number] != null ? String(row[idx.wound_number]).trim() : "",
          wound_type: idx.wound_type != null && row[idx.wound_type] != null ? String(row[idx.wound_type]).trim() : "",
          assessment_date: assessmentDate,
          stage: row[idx.stage] != null ? String(row[idx.stage]).trim() : "",
          location: row[idx.location] != null ? String(row[idx.location]).trim() : "",
          acquired_at_facility: row[idx.acquired_at_facility] != null ? String(row[idx.acquired_at_facility]).trim() : "",
          date_acquired: parseDate(row[idx.date_acquired]),
          admission_date: parseDate(row[idx.admission_date]),
          discharge_date: parseDate(row[idx.discharge_date]),
          status: statusRaw != null ? String(statusRaw).trim() : "",
          size_documented: hasDocumentedCell(sizeRaw),
          status_documented: hasDocumentedCell(statusRaw),
          slough_pct: parsePercentRange(sloughRaw),
          eschar_pct: parsePercentRange(escharRaw),
          epithelialization_pct: parsePercentRange(epithelializationRaw),
          granulation_pct: parsePercentRange(granulationRaw),
          slough_documented: hasDocumentedCell(sloughRaw),
          eschar_documented: hasDocumentedCell(escharRaw),
          epithelialization_documented: hasDocumentedCell(epithelializationRaw),
          granulation_documented: hasDocumentedCell(granulationRaw),
          exudate_amount_text: exudateAmountRaw != null ? String(exudateAmountRaw).trim() : "",
          exudate_type_text: exudateTypeRaw != null ? String(exudateTypeRaw).trim() : "",
          odor_text: odorRaw != null ? String(odorRaw).trim() : "",
          tunneling_text: tunnelingRaw != null ? String(tunnelingRaw).trim() : "",
          undermining_text: underminingRaw != null ? String(underminingRaw).trim() : "",
          exposed_structures_text: exposedStructuresRaw != null ? String(exposedStructuresRaw).trim() : "",
          infection_signs_text: infectionSignsRaw != null ? String(infectionSignsRaw).trim() : "",
          periwound_text: periWoundRaw != null ? String(periWoundRaw).trim() : "",
          pain_text: painRaw != null ? String(painRaw).trim() : "",
          exudate_amount_documented: hasDocumentedCell(exudateAmountRaw),
          exudate_type_documented: hasDocumentedCell(exudateTypeRaw),
          odor_documented: hasDocumentedCell(odorRaw),
          tunneling_documented: hasDocumentedCell(tunnelingRaw),
          undermining_documented: hasDocumentedCell(underminingRaw),
          exposed_structures_documented: hasDocumentedCell(exposedStructuresRaw),
          infection_signs_documented: hasDocumentedCell(infectionSignsRaw),
          periwound_documented: hasDocumentedCell(periWoundRaw),
          pain_documented: hasDocumentedCell(painRaw),
          length_cm: Number(length_cm.toFixed(2)),
          width_cm: Number(width_cm.toFixed(2)),
          depth_cm: Number(depth_cm.toFixed(2)),
          area_cm2,
          stage_score: stageScore(row[idx.stage]),
        };

        const keyMrn = rec.mrn || normalizeText(rec.name);
        const keyPartPrimary = [rec.wound_number, normalizeText(rec.location)].filter(Boolean).join("|");
        const keyPartSecondary = [normalizeText(rec.wound_type), normalizeText(rec.stage)].filter(Boolean).join("|");
        const keyPart = keyPartPrimary || keyPartSecondary || `sheet:${normalizeText(sheetName)}|row:${r}`;
        rec.wound_key = [keyMrn, keyPart].join("|");
        records.push(rec);
        sheetAudit.parsed_rows += 1;
        audit.totals.parsed_rows += 1;
      }

      if (!sheetAudit.parsed_rows && sheetAudit.rows_scanned > 0) {
        sheetAudit.note = sheetAudit.note || "No wound rows met parse criteria.";
      }

      audit.sheets.push(sheetAudit);
    }

    if (!records.length) throw new Error("No wound rows found after parsing workbook.");

    if (!meta.report_start_date || !meta.report_end_date) {
      const ds = records
        .map((r) => r.assessment_date)
        .filter(Boolean)
        .sort((a, b) => a - b);
      if (!meta.report_start_date && ds[0]) meta.report_start_date = ds[0];
      if (!meta.report_end_date && ds[ds.length - 1]) meta.report_end_date = ds[ds.length - 1];
    }

    return { records, meta, audit };
  }

  function statusIndicatesNegatedHealing(statusText) {
    const text = normalizeText(statusText);
    if (!text) return false;
    return (
      /\bnot\s+(healed|resolved|closed|healing|improving)\b/.test(text) ||
      /\bnon[-\s]healing\b/.test(text) ||
      /\bunhealed\b/.test(text) ||
      /\bpartial(?:ly)?\s+healed\b/.test(text)
    );
  }

  function statusIndicatesHealed(statusText) {
    const text = normalizeText(statusText);
    if (!text) return false;
    if (statusIndicatesNegatedHealing(text)) return false;
    return /\b(healed|resolved|closed)\b/.test(text);
  }

  function buildContext(latest, previous, manualOverrides = null) {
    const manual = normalizeManualOverrides(manualOverrides);
    const statusText = normalizeText(latest.status);
    const stageText = normalizeText(latest.stage);
    const woundTypeText = normalizeText(latest.wound_type);
    const locationText = normalizeText(latest.location);
    const reportSignals = inferReportSignals(latest);

    const area = Number(latest.area_cm2 || 0);
    const depth = Number(latest.depth_cm || 0);
    const slough = Number(latest.slough_pct || 0);
    const eschar = Number(latest.eschar_pct || 0);
    const gran = Number(latest.granulation_pct || 0);
    const sloughDocumented = Boolean(latest.slough_documented);
    const escharDocumented = Boolean(latest.eschar_documented);
    const epithelializationDocumented = Boolean(latest.epithelialization_documented);
    const granulationDocumented = Boolean(latest.granulation_documented);
    const tissueBreakdownDocumented = sloughDocumented || escharDocumented || epithelializationDocumented || granulationDocumented;

    const sizeDocumented = Boolean(latest.size_documented);
    const isResolved = statusIndicatesHealed(statusText);
    const looksClosed = sizeDocumented && area === 0 && depth === 0;
    const isActive = !isResolved && !looksClosed;

    const previousArea = previous ? Number(previous.area_cm2 || 0) : null;
    const previousDepth = previous ? Number(previous.depth_cm || 0) : null;
    const previousStageScore = previous ? Number(previous.stage_score || 0) : null;
    const previousAssessmentDate = previous ? parseDate(previous.assessment_date) : null;
    let previousIntervalDays = null;
    if (previousAssessmentDate && latest.assessment_date) {
      previousIntervalDays = dateDiffDays(new Date(latest.assessment_date), new Date(previousAssessmentDate));
    }

    let areaChangePct = null;
    if (previousArea != null && previousArea > 0) {
      areaChangePct = ((area - previousArea) / previousArea) * 100;
    }

    let depthChange = null;
    if (previousDepth != null) depthChange = depth - previousDepth;

    let stageChange = null;
    if (previousStageScore != null) stageChange = Number(latest.stage_score || 0) - previousStageScore;

    const refDate = latest.date_acquired || latest.admission_date;
    let woundAgeDays = null;
    if (refDate && latest.assessment_date) {
      woundAgeDays = dateDiffDays(new Date(latest.assessment_date), new Date(refDate));
    }

    const worseningReasons = [];
    let worsening = false;
    if (areaChangePct != null && areaChangePct >= THRESHOLDS.worsening_area_pct) {
      worsening = true;
      worseningReasons.push(`area increased ${areaChangePct.toFixed(1)}% vs prior`);
    }
    if (depthChange != null && depthChange >= THRESHOLDS.worsening_depth_cm) {
      worsening = true;
      worseningReasons.push(`depth increased ${depthChange.toFixed(2)} cm`);
    }
    if (stageChange != null && stageChange > 0) {
      worsening = true;
      worseningReasons.push("stage severity increased");
    }

    const pressureRelated = (
      ["pressure injury", "unstageable", "deep tissue", "dtpi", "dti"].some((t) => stageText.includes(t)) ||
      woundTypeText.includes("pressure")
    );
    const venousRelated = woundTypeText.includes("venous") || woundTypeText.includes("stasis");
    const arterialRelated = (
      woundTypeText.includes("arterial") ||
      woundTypeText.includes("ischemic") ||
      woundTypeText.includes("ischaemic") ||
      woundTypeText.includes("pad")
    );

    const pyodermaGangrenosum = (
      woundTypeText.includes("pyoderma") ||
      woundTypeText.includes("pg ") ||
      woundTypeText === "pg" ||
      woundTypeText.includes("gangrenosum")
    );
    const burnWound = (
      woundTypeText.includes("burn") ||
      woundTypeText.includes("thermal") ||
      woundTypeText.includes("scald")
    );
    const masdRelated = (
      woundTypeText.includes("masd") ||
      woundTypeText.includes("iad") ||
      woundTypeText.includes("incontinence-associated") ||
      woundTypeText.includes("moisture associated") ||
      woundTypeText.includes("moisture-associated")
    );
    const radiationWound = (
      woundTypeText.includes("radiation") ||
      woundTypeText.includes("osteoradionecrosis") ||
      woundTypeText.includes("radio") && woundTypeText.includes("wound")
    );
    const hypergranulationPresent = (
      woundTypeText.includes("hypergranulat") ||
      woundTypeText.includes("proud flesh") ||
      woundTypeText.includes("overgranulat")
    );
    const necrotizingFasciitis = (
      woundTypeText.includes("necrotizing") ||
      woundTypeText.includes("necrotising") ||
      woundTypeText.includes("fournier") ||
      woundTypeText.includes("gas gangrene") ||
      woundTypeText.includes("clostridial")
    );
    const skinTear = woundTypeText.includes("skin tear");
    const malignantWound = (
      woundTypeText.includes("malignant") ||
      woundTypeText.includes("fungating") ||
      woundTypeText.includes("neoplastic") ||
      woundTypeText.includes("carcinoma") ||
      woundTypeText.includes("tumour") ||
      woundTypeText.includes("tumor")
    );
    const calciphylaxisWound = (
      woundTypeText.includes("calciphylaxis") ||
      woundTypeText.includes("calcific uremic")
    );
    const traumaticWound = (
      woundTypeText.includes("traumatic") ||
      woundTypeText.includes("laceration") ||
      woundTypeText.includes("bite wound") ||
      woundTypeText.includes("abrasion")
    );
    const fistulaWound = (
      woundTypeText.includes("fistula") ||
      woundTypeText.includes("ecf") ||
      woundTypeText.includes("enterocutaneous")
    );
    const surgicalWound = (
      woundTypeText.includes("surgical") ||
      woundTypeText.includes("dehiscence") ||
      woundTypeText.includes("post-op") ||
      woundTypeText.includes("postop") ||
      woundTypeText.includes("incision")
    );
    const osteomyelitisWound = (
      woundTypeText.includes("osteomyelitis") ||
      woundTypeText.includes("exposed bone") ||
      woundTypeText.includes("bone exposed")
    );
    const vasculiticUlcer = (
      woundTypeText.includes("vasculit") ||
      woundTypeText.includes("vasculitic")
    );
    const martorell = (
      woundTypeText.includes("martorell") ||
      woundTypeText.includes("hypertensive ischemic") ||
      woundTypeText.includes("hilu")
    );
    const hidradenitisSuppurativa = (
      woundTypeText.includes("hidradenitis") ||
      woundTypeText.includes("hs ") ||
      woundTypeText === "hs" ||
      woundTypeText.includes("suppurativa")
    );
    const graftWound = (
      woundTypeText.includes("graft") ||
      woundTypeText.includes("stsg") ||
      woundTypeText.includes("ftsg") ||
      woundTypeText.includes("donor site")
    );

    /* Periwound condition from new field */
    const periWoundCondition = normalizeText(latest.periwound_condition || latest.periwound_text || "");
    const periWoundMacerated = periWoundCondition === "macerated";
    const periWoundCallused = periWoundCondition === "callused";

    /* ABI / perfusion from new field */
    const abiRange = normalizeText(latest.abi_range || "");
    const abiDocumented = Boolean(abiRange);
    const abiInadequateForCompression = abiRange === "moderate" || abiRange === "severe" || abiRange === "calcified";
    const abiMildImpairment = abiRange === "mild";
    let diabeticFootRelated = (
      woundTypeText.includes("diabetic") ||
      woundTypeText.includes("neuropathic") ||
      (woundTypeText.includes("plantar") && !arterialRelated && !venousRelated) ||
      ((locationText.includes("foot") || locationText.includes("toe")) && woundTypeText.includes("ulcer") && !arterialRelated && !venousRelated)
    );
    if (manual.diabetic === "yes") diabeticFootRelated = true;
    if (manual.diabetic === "no") diabeticFootRelated = false;

    let woundPathway = "general";
    if (pressureRelated) woundPathway = "pressure";
    else if (diabeticFootRelated) woundPathway = "diabetic_foot";
    else if (venousRelated && arterialRelated) woundPathway = "mixed_leg";
    else if (venousRelated) woundPathway = "venous";
    else if (arterialRelated) woundPathway = "arterial";
    const pressureReliefNeeded = pressureRelated || locationText.includes("heel");
    let cavityLikely = depth >= 0.3;

    let debridementNeeded = (
      stageText.includes("unstageable") ||
      eschar >= THRESHOLDS.debridement_eschar_pct ||
      slough >= THRESHOLDS.debridement_slough_pct
    );

    let heelStableEscharException = locationText.includes("heel") && eschar >= THRESHOLDS.heel_stable_eschar_pct;
    const cleanBed = eschar === 0 && slough <= THRESHOLDS.clean_bed_slough_max_pct;
    const granulating = gran >= THRESHOLDS.collagen_min_granulation_pct && gran < THRESHOLDS.collagen_max_granulation_pct;

    const chronic = woundAgeDays != null && woundAgeDays >= THRESHOLDS.chronic_days;
    const stalled = chronic || (
      previousIntervalDays != null && previousIntervalDays >= 14 &&
      areaChangePct != null && areaChangePct > -15
    );
    let potentialBioburden = slough >= THRESHOLDS.debridement_slough_pct || worsening;
    let exudateProxy = area >= 4 || depth >= 0.3 || slough >= 30 || eschar >= 20;

    const effectiveExudateAmount = manual.exudate_amount || reportSignals.inferredExudateAmount;
    const effectiveExudateType = manual.exudate_type || reportSignals.inferredExudateType;
    const effectiveOdor = manual.odor || reportSignals.inferredOdor;
    const effectiveInfectionSigns = uniqueOverrideValues(
      [...(manual.infection_signs || []), ...(reportSignals.inferredInfectionSigns || [])],
      OVERRIDE_INFECTION_SIGN_OPTIONS,
    );
    const effectiveExposedStructures = uniqueOverrideValues(
      [...(manual.exposed_structures || []), ...(reportSignals.inferredExposedStructures || [])],
      OVERRIDE_EXPOSED_STRUCTURE_OPTIONS,
    );

    const manualExudateSeverity = effectiveExudateAmount ? OVERRIDE_EXUDATE_SEVERITY[effectiveExudateAmount] : null;
    if (manual.thickness === "partial_thickness") cavityLikely = false;
    if (manual.thickness === "full_thickness") cavityLikely = true;
    if (manual.thickness === "eschar_covered") debridementNeeded = true;
    if (reportSignals.cavitySignal) cavityLikely = true;
    if (manualExudateSeverity != null) {
      exudateProxy = manualExudateSeverity >= 2;
      if (manualExudateSeverity >= 3) potentialBioburden = true;
    }

    const exudateTypeRisk = new Set(["purulent", "green_brown", "thick_viscous", "mixed"]);
    if (effectiveExudateType && exudateTypeRisk.has(effectiveExudateType)) {
      potentialBioburden = true;
    }

    if (effectiveOdor === "moderate" || effectiveOdor === "strong_foul") {
      potentialBioburden = true;
    }

    const exposedSet = new Set(effectiveExposedStructures || []);
    const deepStructureExposed = ["muscle", "tendon", "capsule", "joint", "bone"].some((value) => exposedSet.has(value));
    if (deepStructureExposed) cavityLikely = true;

    if (reportSignals.necroticSignal && !tissueBreakdownDocumented) {
      debridementNeeded = true;
      potentialBioburden = true;
    }

    if (effectiveInfectionSigns.length) {
      potentialBioburden = true;
      if (!worseningReasons.some((item) => normalizeText(item).includes("infection"))) {
        worseningReasons.push("infection signs present from report/rerun inputs");
      }
      worsening = true;
    }

    if (reportSignals.stableDryHeelEscharSignal && locationText.includes("heel")) {
      heelStableEscharException = true;
    }

    if (heelStableEscharException && (effectiveInfectionSigns.length || (effectiveOdor && effectiveOdor !== "none"))) {
      heelStableEscharException = false;
    }
    if (
      manual.thickness === "eschar_covered" &&
      locationText.includes("heel") &&
      !effectiveInfectionSigns.length &&
      (!effectiveOdor || effectiveOdor === "none")
    ) {
      heelStableEscharException = true;
    }

    const diabeticSuboptimal4WeekProgress = (
      diabeticFootRelated &&
      previousIntervalDays != null &&
      previousIntervalDays >= THRESHOLDS.four_week_window_min_days &&
      areaChangePct != null &&
      areaChangePct > -THRESHOLDS.diabetic_four_week_area_reduction_target_pct
    );
    const venousSuboptimal4WeekProgress = (
      venousRelated &&
      previousIntervalDays != null &&
      previousIntervalDays >= THRESHOLDS.four_week_window_min_days &&
      areaChangePct != null &&
      areaChangePct > -THRESHOLDS.venous_four_week_area_reduction_target_pct
    );

    return {
      statusText, stageText, woundTypeText, locationText,
      area, depth, slough, eschar, gran,
      sloughDocumented, escharDocumented, epithelializationDocumented, granulationDocumented, tissueBreakdownDocumented,
      isResolved, looksClosed, isActive,
      previousArea, previousDepth, previousStageScore,
      areaChangePct, depthChange, stageChange, previousIntervalDays,
      woundAgeDays, worsening, worseningReasons,
      pressureRelated, venousRelated, arterialRelated, diabeticFootRelated, woundPathway, pressureReliefNeeded, cavityLikely, debridementNeeded, heelStableEscharException,
      cleanBed, granulating, chronic, stalled,
      potentialBioburden, exudateProxy,
      pyodermaGangrenosum, burnWound, masdRelated, radiationWound, hypergranulationPresent,
      necrotizingFasciitis, skinTear, malignantWound, calciphylaxisWound, traumaticWound, fistulaWound,
      surgicalWound, osteomyelitisWound, vasculiticUlcer, martorell, hidradenitisSuppurativa, graftWound,
      osteomyelitisSignal: (osteomyelitisWound || woundTypeText.includes("osteomyelitis")),
      epiboleSignal: (periWoundCallused || woundTypeText.includes("epibole") || woundTypeText.includes("rolled edge")),
      periWoundCondition, periWoundMacerated, periWoundCallused,
      abiDocumented, abiInadequateForCompression, abiMildImpairment, abiRange,
      diabeticSuboptimal4WeekProgress, venousSuboptimal4WeekProgress,
      manualOverridesApplied: Boolean(
        manual.diabetic ||
        manual.thickness ||
        manual.exudate_amount ||
        manual.exudate_type ||
        manual.odor ||
        manual.exposed_structures.length ||
        manual.infection_signs.length
      ),
      manualDiabetic: manual.diabetic,
      manualThickness: manual.thickness,
      manualExudateAmount: manual.exudate_amount,
      manualExudateType: manual.exudate_type,
      manualOdor: manual.odor,
      manualExposedStructures: manual.exposed_structures,
      manualInfectionSigns: manual.infection_signs,
      reportSignalText: reportSignals.reportText,
      reportExudateAmount: reportSignals.inferredExudateAmount,
      reportExudateType: reportSignals.inferredExudateType,
      reportOdor: reportSignals.inferredOdor,
      reportInfectionSigns: reportSignals.inferredInfectionSigns,
      reportExposedStructures: reportSignals.inferredExposedStructures,
      reportCavitySignal: reportSignals.cavitySignal,
      reportNecroticSignal: reportSignals.necroticSignal,
      effectiveExudateAmount,
      effectiveExudateType,
      effectiveOdor,
      effectiveInfectionSigns,
      effectiveExposedStructures,
    };
  }

  function pathwayDisplayName(pathway) {
    switch (String(pathway || "").trim()) {
      case "pressure":
        return "Pressure";
      case "venous":
        return "Venous";
      case "diabetic_foot":
        return "Diabetic Foot";
      case "arterial":
        return "Arterial/Ischemic";
      case "mixed_leg":
        return "Mixed Arterial-Venous";
      default:
        return "General";
    }
  }

  function pathwayNarrativePhrase(pathwayValue) {
    const pathway = normalizeText(pathwayValue);
    if (pathway === "pressure") return getNarrativePhrase("pathway_pressure");
    if (pathway === "venous") return getNarrativePhrase("pathway_venous");
    if (pathway === "diabetic foot" || pathway === "diabetic_foot") return getNarrativePhrase("pathway_diabetic_foot");
    if (pathway === "arterial/ischemic" || pathway === "arterial") return getNarrativePhrase("pathway_arterial");
    if (pathway === "mixed arterial-venous" || pathway === "mixed_leg") return getNarrativePhrase("pathway_mixed_leg");
    return getNarrativePhrase("pathway_general");
  }

  function pathwayReasonFromContext(ctx) {
    if (!ctx || typeof ctx !== "object") return "No specific wound-type signal was detected from export fields.";
    switch (ctx.woundPathway) {
      case "pressure":
        return "Pressure/stage indicators were detected.";
      case "venous":
        return "Venous/stasis indicators were detected.";
      case "diabetic_foot":
        return "Diabetic foot/offloading indicators were detected.";
      case "arterial":
        return "Arterial/ischemic indicators were detected.";
      case "mixed_leg":
        return "Both venous and arterial indicators were detected.";
      default:
        return "No dominant specific wound-type indicator was detected.";
    }
  }

  function sortByPriority(items) {
    return items.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }

  function optionsLikelyMatch(optionA, optionB) {
    const a = normalizeSupplyKey(optionA || "");
    const b = normalizeSupplyKey(optionB || "");
    if (!a || !b) return false;
    return a === b || a.includes(b) || b.includes(a);
  }

  function findCatalogEntryForOption(optionText) {
    const target = normalizeSupplyKey(optionText || "");
    if (!target) return null;

    let best = null;
    let bestScore = -1;
    const targetTokens = new Set(target.split(" ").filter((x) => x.length > 2));

    for (const entry of TREATMENT_CATALOG) {
      const option = normalizeSupplyKey(entry.treatment_option || "");
      if (!option) continue;

      let score = 0;
      if (option === target) {
        score = 1000;
      } else if (option.includes(target) || target.includes(option)) {
        score = 700 + Math.min(option.length, target.length);
      } else {
        const optionTokens = new Set(option.split(" ").filter((x) => x.length > 2));
        let overlap = 0;
        targetTokens.forEach((tk) => {
          if (optionTokens.has(tk)) overlap += 1;
        });
        score = overlap * 80;
      }

      if (score > bestScore) {
        best = entry;
        bestScore = score;
      }
    }

    return bestScore >= 120 ? best : null;
  }

  function resolveSourceUrlFromReference(referenceText) {
    const raw = String(referenceText || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;

    const ref = normalizeText(raw);
    let bestUrl = "";
    let bestScore = -1;
    const refTokens = new Set(ref.split(" ").filter((x) => x.length > 2));
    const sourceSections = CLINICAL_SOURCES.concat(CLINICAL_SOURCES_DEEP_DIVE);

    for (const section of sourceSections) {
      for (const item of section.items || []) {
        if (!item?.url) continue;
        const label = normalizeText(item.label || "");
        if (!label) continue;

        let score = 0;
        if (label === ref) {
          score = 1000;
        } else if (label.includes(ref) || ref.includes(label)) {
          score = 700 + Math.min(label.length, ref.length);
        } else {
          const labelTokens = new Set(label.split(" ").filter((x) => x.length > 2));
          let overlap = 0;
          refTokens.forEach((tk) => {
            if (labelTokens.has(tk)) overlap += 1;
          });
          score = overlap * 75;
        }

        if (score > bestScore) {
          bestScore = score;
          bestUrl = item.url;
        }
      }
    }

    return bestScore >= 150 ? bestUrl : "";
  }

  function santylClinicalUseRationale() {
    return "Santyl is typically used for selective enzymatic debridement of devitalized collagen/slough in chronic dermal ulcers, often between sharp debridement sessions or when conservative pacing is preferred.";
  }

  function buildStepRationaleItems(stepValues, treatments) {
    const values = uniqueNonEmpty(stepValues || []);
    const out = [];

    for (const optionText of values) {
      const optionKey = normalizeSupplyKey(optionText);
      const candidates = (treatments || []).filter((t) => optionsLikelyMatch(t?.option, optionText));
      const nonGuardrailCandidates = candidates.filter((t) => normalizeText(t?.category || "") !== "compatibility guardrail");
      const preferredPool = nonGuardrailCandidates.length ? nonGuardrailCandidates : candidates;

      let treatmentMatch = null;
      let bestScore = -1;
      for (const candidate of preferredPool) {
        const candidateKey = normalizeSupplyKey(candidate?.option || "");
        let score = 0;
        if (candidateKey === optionKey) score = 1000;
        else if (candidateKey.includes(optionKey) || optionKey.includes(candidateKey)) score = 700;
        else {
          const optionTokens = new Set(optionKey.split(" ").filter((x) => x.length > 2));
          const candidateTokens = new Set(candidateKey.split(" ").filter((x) => x.length > 2));
          optionTokens.forEach((token) => {
            if (candidateTokens.has(token)) score += 40;
          });
        }
        if (score > bestScore) {
          bestScore = score;
          treatmentMatch = candidate;
        }
      }

      const catalogEntry = findCatalogEntryForOption(optionText) || findCatalogEntryForOption(treatmentMatch?.option || "");
      let sourceReference = catalogEntry?.source_reference || "";
      let rationale = String(
        treatmentMatch?.rationale ||
        catalogEntry?.clinical_notes ||
        "Selected from current pathway and wound trend signals."
      ).trim();
      const normalizedOption = normalizeText(optionText);
      const isSantylOption = normalizedOption.includes("santyl") || normalizedOption.includes("collagenase");
      if (isSantylOption && !sourceReference) {
        sourceReference = "DailyMed Santyl label";
      }
      if (isSantylOption && normalizeText(rationale).includes("auto-blocked for this wound")) {
        rationale = santylClinicalUseRationale();
      }
      if (isSantylOption && /blocked|hold/i.test(rationale)) {
        const santylUse = santylClinicalUseRationale();
        if (!normalizeText(rationale).includes(normalizeText(santylUse))) {
          rationale = `${rationale} ${santylUse}`;
        }
      }
      const sourceUrl = resolveSourceUrlFromReference(sourceReference);

      out.push({
        option: optionText,
        rationale,
        source_reference: sourceReference,
        source_url: sourceUrl,
      });
    }

    return out;
  }

  function responseToneFromSignal(signal) {
    const text = normalizeText(signal);
    if (text.includes("improving")) return "improving";
    if (text.includes("worsening") || text.includes("not working")) return "worsening";
    if (text.includes("mixed")) return "mixed";
    return "indeterminate";
  }

  function buildWeekToWeekLine(row) {
    const signal = String(row?.treatment_effect_signal || "").trim();
    if (!signal) return "";

    const metrics = [];

    const areaPct = Number(row?.area_change_pct_since_prior_report);
    if (Number.isFinite(areaPct)) metrics.push(`Area ${areaPct >= 0 ? "+" : ""}${areaPct.toFixed(1)}%`);

    const depthDelta = Number(row?.depth_change_cm_since_prior_report);
    if (Number.isFinite(depthDelta)) metrics.push(`Depth ${depthDelta >= 0 ? "+" : ""}${depthDelta.toFixed(2)} cm`);

    const sloughDelta = Number(row?.slough_change_pts_since_prior_report);
    if (Number.isFinite(sloughDelta)) metrics.push(`Slough ${sloughDelta >= 0 ? "+" : ""}${sloughDelta.toFixed(1)} pts`);

    return metrics.length
      ? `Response Score: ${signal} | ${metrics.join(" | ")}`
      : `Response Score: ${signal}`;
  }

  function buildDataQualityFlagsForRow(row) {
    if (!row || typeof row !== "object") return [];
    const flags = [];
    if (!Boolean(row.size_documented)) {
      flags.push("size (LxWxD) not charted");
    }
    if (!String(row.status || "").trim()) {
      flags.push("status not charted");
    }
    const tissueDocumented = Boolean(row.slough_documented) ||
      Boolean(row.eschar_documented) ||
      Boolean(row.epithelialization_documented) ||
      Boolean(row.granulation_documented);
    const structuredClinicalDocumented = Boolean(row.exudate_amount_documented) ||
      Boolean(row.exudate_type_documented) ||
      Boolean(row.odor_documented) ||
      Boolean(row.tunneling_documented) ||
      Boolean(row.undermining_documented) ||
      Boolean(row.exposed_structures_documented) ||
      Boolean(row.infection_signs_documented) ||
      Boolean(row.periwound_documented);
    if (!tissueDocumented && !structuredClinicalDocumented) {
      flags.push("tissue-bed fields not charted");
    } else if (!tissueDocumented && structuredClinicalDocumented) {
      flags.push("tissue-bed percentages missing (using structured wound descriptors)");
    }
    return flags;
  }

  function buildDataQualityLine(row) {
    const flags = Array.isArray(row?.data_quality_flags)
      ? row.data_quality_flags.filter((item) => String(item || "").trim())
      : buildDataQualityFlagsForRow(row);
    if (!flags.length) return "";
    return `Data Quality: Weak inputs (${flags.join("; ")}). Recommendations may rely on fallback logic.`;
  }

  function computeRecommendationConfidence(latestRow, context = null, previous = null) {
    const row = latestRow && typeof latestRow === "object" ? latestRow : {};
    const flags = buildDataQualityFlagsForRow(row);
    const positives = [];
    const limits = [];
    let score = 62;

    if (Boolean(row.size_documented)) {
      score += 8;
      positives.push("measurements documented");
    } else {
      limits.push("measurements missing");
    }

    if (String(row.status || "").trim()) {
      score += 5;
      positives.push("status documented");
    } else {
      limits.push("status missing");
    }

    const tissueDocumented = Boolean(row.slough_documented) ||
      Boolean(row.eschar_documented) ||
      Boolean(row.epithelialization_documented) ||
      Boolean(row.granulation_documented);
    if (tissueDocumented) {
      score += 10;
      positives.push("tissue-bed percentages documented");
    }

    const structuredSignals = [
      row.exudate_amount_documented,
      row.exudate_type_documented,
      row.odor_documented,
      row.tunneling_documented,
      row.undermining_documented,
      row.exposed_structures_documented,
      row.infection_signs_documented,
      row.periwound_documented,
    ].filter(Boolean).length;
    if (structuredSignals > 0) {
      score += Math.min(12, structuredSignals * 2);
      positives.push(structuredSignals >= 3 ? "multiple structured wound descriptors available" : "some structured descriptors available");
    }

    if (!tissueDocumented && structuredSignals === 0) {
      score -= 8;
      limits.push("tissue-bed descriptors limited");
    }

    if (context?.manualOverridesApplied) {
      score += 8;
      positives.push("manual clinical rerun inputs applied");
    }

    if (context?.reportSignalText) {
      score += 4;
    }

    if (previous || Number.isFinite(context?.previousIntervalDays)) {
      score += 8;
      positives.push("week-to-week comparison available");
    } else {
      score -= 6;
      limits.push("no prior matched wound record");
    }

    if (Array.isArray(context?.effectiveInfectionSigns) && context.effectiveInfectionSigns.length) score += 2;
    if (Array.isArray(context?.effectiveExposedStructures) && context.effectiveExposedStructures.length) score += 2;

    if (flags.length) {
      score -= Math.min(18, flags.length * 6);
      limits.push(flags[0]);
    }

    if (
      normalizeText(context?.woundPathway || "general") === "general" &&
      !tissueDocumented &&
      structuredSignals < 2
    ) {
      score -= 5;
    }

    score = Math.max(25, Math.min(98, Math.round(score)));
    const label = score >= 82 ? "High" : (score >= 67 ? "Moderate" : "Low");

    const summaryParts = [];
    if (positives.length) summaryParts.push(`Strengths: ${positives.slice(0, 2).join(", ")}.`);
    if (limits.length) summaryParts.push(`Limits: ${limits.slice(0, 2).join(", ")}.`);

    return {
      score,
      label,
      summary: summaryParts.join(" ").trim(),
    };
  }

  function buildConfidenceLine(row) {
    const label = String(row?.recommendation_confidence_label || "").trim();
    const score = Number(row?.recommendation_confidence_score);
    if (!label || !Number.isFinite(score)) return "";
    const summary = String(row?.recommendation_confidence_summary || "").trim();
    return summary
      ? `Confidence: ${label} (${score}/100). ${summary}`
      : `Confidence: ${label} (${score}/100).`;
  }

  function evaluateDebridementSafetyGate(c) {
    if (!c) {
      return { allowDebridement: true, holdReasons: [], warningReasons: [] };
    }

    const holdReasons = [];
    const warningReasons = [];

    if (c.heelStableEscharException) {
      holdReasons.push("stable dry heel eschar signal - use conservative heel-eschar pathway unless status changes");
    }

    if (c.arterialRelated || c.woundPathway === "mixed_leg") {
      holdReasons.push("perfusion/arterial risk signal - verify perfusion safety before selecting technique");
    }

    if (c.worsening && c.slough >= 50) {
      holdReasons.push("high slough with worsening trend - reassess infection severity/escalation before selecting local debridement method");
    }

    if (c.diabeticFootRelated && c.worsening) {
      warningReasons.push("diabetic-foot worsening trend present - confirm infection depth and offloading adherence");
    }

    return {
      allowDebridement: holdReasons.length === 0,
      holdReasons,
      warningReasons,
    };
  }

  function selectDebridementPlan(c) {
    if (!c) return [];

    const out = [];
    const push = (priority, category, option, rationale, cautions, score) => {
      if (!Number.isFinite(score) || score <= 0) return;
      out.push({ priority, category, option, rationale, cautions, score });
    };

    const heavyBurden = c.eschar >= THRESHOLDS.debridement_eschar_pct || c.slough >= THRESHOLDS.debridement_slough_pct;
    const moderateBurden = c.slough >= THRESHOLDS.debridement_slough_moderate_pct;
    const lowBurden = c.slough >= 10 && c.slough < THRESHOLDS.debridement_slough_moderate_pct;
    const perfusionCaution = c.arterialRelated || c.woundPathway === "mixed_leg";

    if (heavyBurden || c.worsening) {
      let score = 8;
      if (c.worsening) score += 2;
      if (c.eschar >= THRESHOLDS.debridement_eschar_pct) score += 2;
      if (c.slough >= THRESHOLDS.debridement_slough_pct) score += 1;
      if (perfusionCaution) score -= 2;
      push(
        "high",
        "Debridement",
        "Sharp/surgical debridement",
        "Higher necrotic burden and/or worsening trend favors rapid source control of devitalized tissue.",
        "Confirm perfusion and bleeding risk first; stable dry heel eschar is an exception.",
        score,
      );
    }

    if (moderateBurden || heavyBurden) {
      let score = heavyBurden ? 6 : 4;
      if (c.chronic) score += 1;
      if (perfusionCaution) score += 1;
      push(
        heavyBurden ? "medium" : "low",
        "Enzymatic Debridement",
        "Santyl (collagenase)",
        "Selective enzymatic debridement can maintain bed prep between sharp sessions or when conservative pacing is needed.",
        "Silver and some heavy-metal antiseptics can reduce activity; rinse carefully before application.",
        score,
      );
    }

    if (heavyBurden || (moderateBurden && c.potentialBioburden)) {
      let xsonxScore = 5;
      if (c.potentialBioburden) xsonxScore += 2;
      if (moderateBurden) xsonxScore += 1;
      if (c.worsening) xsonxScore += 1;
      push(
        "medium",
        "Device-Assisted Debridement",
        "XSONX wound hygiene/debridement system",
        "Consider when repeat selective debridement and wound hygiene are needed alongside manual debridement strategy.",
        "Use by trained clinicians and follow device IFU plus infection-control protocol.",
        xsonxScore,
      );

      let arobellaScore = 5;
      if (c.potentialBioburden) arobellaScore += 2;
      if (heavyBurden) arobellaScore += 2;
      if (c.cavityLikely) arobellaScore += 1;
      push(
        "medium",
        "Device-Assisted Debridement",
        "Arobella Qoustic wound therapy system",
        "Consider for ultrasound-assisted debridement and lavage when wound-bed preparation needs escalation.",
        "Use by trained clinicians; follow IFU contraindications and facility protocol.",
        arobellaScore,
      );
    }

    if (lowBurden && c.eschar < THRESHOLDS.debridement_eschar_pct) {
      let score = 4;
      if (!c.potentialBioburden) score += 1;
      if (c.stalled) score += 1;
      push(
        "low",
        "Autolytic/Antimicrobial",
        "MediHoney dressing",
        "Supports selective autolytic debridement in low-burden slough by maintaining a moist acidic environment that can help lift devitalized tissue and reduce local bioburden pressure when aggressive debridement is not required.",
        "Expect possible early increase in drainage or stinging; use periwound barrier protection, reassess response within about 1 week, and avoid in known honey allergy.",
        score,
      );
    }

    out.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const pa = PRIORITY_ORDER[a.priority] ?? 99;
      const pb = PRIORITY_ORDER[b.priority] ?? 99;
      if (pa !== pb) return pa - pb;
      return a.option.localeCompare(b.option);
    });

    return out.map(({ score, ...rest }) => rest);
  }

  function applyCompatibilityGuardrails(treatments, context = null) {
    const incoming = Array.isArray(treatments) ? [...treatments] : [];
    if (!incoming.length) return incoming;

    const c = context && typeof context === "object" ? context : {};
    const optionTexts = incoming.map((item) => normalizeText(item?.option || ""));
    const hasSantyl = optionTexts.some((text) => text.includes("santyl") || text.includes("collagenase"));
    const perfusionRisk = Boolean(c.arterialRelated || c.woundPathway === "mixed_leg");
    const dryProfile = (c.effectiveExudateAmount === "scant" || c.effectiveExudateAmount === "none") && !c.exudateProxy;
    const highDrainProfile = Boolean(c.exudateProxy) || c.effectiveExudateAmount === "large" || c.effectiveExudateAmount === "copious";

    const guardrails = [];
    const guardrailKeys = new Set();
    const addGuardrail = (priority, option, rationale, cautions = "") => {
      const key = normalizeText(option);
      if (!key || guardrailKeys.has(key)) return;
      guardrailKeys.add(key);
      guardrails.push({
        priority,
        category: "Compatibility Guardrail",
        option,
        rationale,
        cautions,
      });
    };

    const allowed = [];
    const blocked = [];
    for (const item of incoming) {
      const option = normalizeText(item?.option || "");
      const category = normalizeText(item?.category || "");
      const isSantyl = option.includes("santyl") || option.includes("collagenase");
      const isAntimicrobialChemistry = (
        option.includes("silver") ||
        option.includes("iodine") ||
        option.includes("iodo") ||
        option.includes("dakin") ||
        option.includes("hypochlorous") ||
        option.includes("acetic acid")
      );
      const isCompression = category.includes("compression") || option.includes("compression");
      const isHighAbsorbency = option.includes("superabsorbent") || option.includes("calcium alginate") || option.includes("alginate dressing");
      const isHydrogel = option.includes("hydrogel");

      let blockReason = "";
      if (hasSantyl && !isSantyl && isAntimicrobialChemistry) {
        blockReason = "santyl_chemistry";
      } else if (perfusionRisk && isCompression) {
        blockReason = "perfusion_compression";
      } else if (dryProfile && isHighAbsorbency) {
        blockReason = "dry_absorbency";
      } else if (highDrainProfile && isHydrogel) {
        blockReason = "high_drain_hydrogel";
      }

      if (blockReason) {
        blocked.push({ item, reason: blockReason });
        continue;
      }
      allowed.push(item);
    }

    if (!blocked.length) return incoming;

    if (blocked.some((entry) => entry.reason === "santyl_chemistry")) {
      addGuardrail(
        "high",
        "Santyl selected: separate collagenase from silver/iodine/antiseptic chemistries unless compatibility is explicitly confirmed.",
        `Compatibility safeguard: silver/iodine and oxidizing antiseptic products can reduce collagenase activity. If both strategies are needed, sequence with saline rinse-out and verify product-level compatibility before reintroduction. ${santylClinicalUseRationale()}`,
        "Use protocolized sequencing and reassess local infection/bioburden need at each dressing interval.",
      );
    }
    if (blocked.some((entry) => entry.reason === "perfusion_compression")) {
      addGuardrail(
        "high",
        "Perfusion-risk signal: hold full compression selection until arterial safety is confirmed.",
        "Arterial or mixed-leg pathway signal detected. Compression can be harmful if perfusion is not adequate.",
        "Confirm arterial perfusion (for example ABI/toe pressure or specialist input) before full-compression pathway.",
      );
    }
    if (blocked.some((entry) => entry.reason === "dry_absorbency")) {
      addGuardrail(
        "medium",
        "Dry/low-drain profile: avoid very absorptive dressings as first choice.",
        "Current inputs suggest low drainage. High-absorbency products can over-dry the wound bed and slow epithelial migration.",
        "Prefer moisture-balanced options and reassess if drainage pattern changes.",
      );
    }
    if (blocked.some((entry) => entry.reason === "high_drain_hydrogel")) {
      addGuardrail(
        "medium",
        "High-drain profile: avoid hydrogel-only pathway.",
        "Hydrogel can worsen maceration when drainage is already moderate-high.",
        "Use absorptive dressings first and add periwound protection.",
      );
    }

    return sortByPriority([...guardrails, ...allowed]);
  }

  function buildSafetyChecks(context, treatments) {
    if (!context) return [];
    const out = [];
    const add = (priority, text) => out.push({ priority, text });

    if (context.necrotizingFasciitis) {
      add("high", "⚠ EMERGENCY — Necrotizing Fasciitis Suspected: activate emergency surgical consultation NOW. Do not debride at bedside.", "Necrotizing fasciitis / gas gangrene is a surgical emergency with mortality >30% if delayed. Signs: rapidly spreading erythema, crepitus, severe pain out of proportion, gray/dishwater drainage, systemic sepsis. Every hour of delay increases mortality.");
      return sortByPriority(out);
    }

    if (context.calciphylaxisWound) {
      add("high", "⚠ Calciphylaxis: AVOID SURGICAL DEBRIDEMENT in most cases — risk of non-healing defects. Nephrology/wound specialist required.", "Calciphylaxis (calcific uremic arteriolopathy) results in ischemic skin necrosis. Surgical debridement typically worsens outcomes. Medical management (sodium thiosulfate, cinacalcet, bisphosphonates) is primary.");
      return sortByPriority(out);
    }

    if (context.malignantWound) {
      add("medium", "Malignant / Fungating Wound: goals are palliative — comfort, odor control, exudate management. Avoid aggressive debridement unless specifically ordered by oncology.", "Malignant wounds have invading tumor vasculature; aggressive debridement causes severe bleeding and does not promote healing. Oncology input required before any procedural intervention.");
      return sortByPriority(out);
    }

    if (context.pyodermaGangrenosum) {
      add("high", "PYODERMA GANGRENOSUM SIGNAL DETECTED: DO NOT DEBRIDE. Pathergy risk — sharp debridement or surgical trauma will cause rapid wound worsening. Management requires immunosuppressive therapy (corticosteroids, cyclosporine, biologics). Dermatology/rheumatology consult required urgently.");
      return sortByPriority(out);
    }

    const gate = evaluateDebridementSafetyGate(context);

    if (!gate.allowDebridement) {
      add("high", `Debridement gate active: ${gate.holdReasons.join("; ")}.`);
    }
    gate.warningReasons.forEach((reason) => add("medium", `Debridement caution: ${reason}.`));

    if (context.heelStableEscharException) {
      add("high", "Stable dry heel eschar signal: verify conservative heel-eschar pathway before debridement.");
    }

    if (context.arterialRelated || context.woundPathway === "mixed_leg") {
      add("high", "Perfusion-risk signal: verify perfusion/arterial status before aggressive debridement or full compression.");
    }

    if (context.woundPathway === "mixed_leg") {
      add("high", "Mixed arterial-venous pattern: avoid high-compression pathway until arterial safety is clarified.");
    }

    if (context.diabeticFootRelated && (context.potentialBioburden || context.worsening)) {
      add("medium", "Diabetic-foot with bioburden/worsening signal: reassess infection depth and escalate promptly if systemic signs appear.");
    }

    if (Array.isArray(context.effectiveInfectionSigns) && context.effectiveInfectionSigns.length) {
      const labels = labelsForOverrideValues(context.effectiveInfectionSigns);
      add("high", `Infection signs detected from report/rerun inputs: ${labels.join(", ")}. Consider infection escalation pathway if bedside exam confirms.`);
    }

    if (Array.isArray(context.effectiveExposedStructures) && context.effectiveExposedStructures.length) {
      const labels = labelsForOverrideValues(context.effectiveExposedStructures);
      add("medium", `Exposed structures detected from report/rerun inputs: ${labels.join(", ")}.`);
      if (context.effectiveExposedStructures.includes("bone") || context.effectiveExposedStructures.includes("joint")) {
        add("high", "Bone/joint exposure selected: confirm deeper-structure risk and escalation plan.");
      }
    }

    if (context.reportNecroticSignal && !context.tissueBreakdownDocumented) {
      add("medium", "Report text includes necrotic/slough/eschar terms while tissue-bed percentages are missing.");
    }

    if (context.reportCavitySignal) {
      add("medium", "Report text includes cavity/tunneling/undermining descriptors.");
    }

    const optionTexts = (treatments || []).map((item) => normalizeText(item?.option || ""));
    const hasSantyl = optionTexts.some((text) => text.includes("santyl") || text.includes("collagenase"));
    const hasPotentialCollagenaseConflict = optionTexts.some((text) => (
      text.includes("silver") ||
      text.includes("iodine") ||
      text.includes("iodo") ||
      text.includes("dakin") ||
      text.includes("hypochlorous") ||
      text.includes("acetic acid")
    ));
    if (hasSantyl && hasPotentialCollagenaseConflict) {
      add("medium", "Santyl combination pathway selected: use sequence/rinse protocol and verify product-level compatibility before collagenase application.");
    }

    (treatments || []).forEach((item) => {
      const category = normalizeText(item?.category || "");
      if (category.includes("compatibility guardrail")) {
        add("high", String(item.option || "").trim());
      }
    });

    return sortByPriority(out);
  }

  function buildTypeMeasurementFallbackSuggestions(context) {
    const c = context || {};
    const out = [];
    const add = (priority, category, option, rationale, cautions = "") => {
      out.push({ priority, category, option, rationale, cautions });
    };

    add(
      "medium",
      "Cleansing",
      "Normal saline irrigation",
      "Default baseline from wound type and measurements when tissue-bed detail is limited in the export.",
      "Use adequate volume and gentle pressure per protocol."
    );

    if (c.woundPathway === "venous" && !c.arterialRelated) {
      add(
        "high",
        "Compression",
        "Multilayer compression bandaging",
        "Venous wound type signal supports compression as a core pathway when perfusion is adequate.",
        "Confirm arterial safety before full compression."
      );
    }

    if (c.woundPathway === "diabetic_foot") {
      add(
        "high",
        "Diabetic Foot Offloading",
        "Removable knee-high walker",
        "Diabetic foot type signal supports offloading as a core default pathway.",
        "Escalate to non-removable options when clinically appropriate."
      );
    }

    if (c.pressureReliefNeeded || c.woundPathway === "pressure") {
      add(
        "medium",
        "Pressure Relief",
        "Heel offloading boots / heel suspension",
        "Pressure-related wound type/location signal supports targeted offloading.",
        "Inspect skin at each dressing interval."
      );
      add(
        "medium",
        "Pressure Relief",
        "Support surfaces (high-spec foam / alternating pressure mattress)",
        "Pressure pathway defaults include support-surface optimization.",
        "Use with repositioning schedule."
      );
    }

    if (c.cavityLikely || Number(c.depth || 0) >= 0.3) {
      add(
        "medium",
        "Wound Packing",
        "Gauze packing / ribbon",
        "Depth profile suggests cavity fill support is likely needed.",
        "Avoid overpacking and document packing material/length."
      );
    }

    if (c.exudateProxy || Number(c.area || 0) >= 4 || Number(c.depth || 0) >= 0.3) {
      add(
        "medium",
        "Wound Dressing",
        "Foam dressing (standard or silicone border)",
        "Size/depth profile supports absorptive moisture-balancing dressing selection.",
        "Change when approaching strike-through."
      );
      add(
        "medium",
        "Exudate Management",
        "Calcium alginate (or silver alginate when bioburden concern exists)",
        "Higher drainage profile supports absorptive primary dressing choice.",
        "Needs secondary cover and saturation checks."
      );
      add(
        "medium",
        "Change Frequency",
        "Daily and PRN for saturation/soiling",
        "Measurement profile suggests closer reassessment interval.",
        "Shorten interval if periwound maceration develops."
      );
    } else {
      add(
        "low",
        "Wound Dressing",
        "Hydrogel or moisture-balancing non-antimicrobial dressing",
        "Smaller/lower-depth wounds generally default to moisture balance support.",
        "Avoid over-hydration and reassess weekly."
      );
      add(
        "low",
        "Change Frequency",
        "Every 48-72 hours and PRN soiling",
        "Lower-drainage measurement profile supports a less frequent interval.",
        "Tighten interval if response worsens."
      );
    }

    return sortByPriority(out);
  }

  function buildTreatmentSuggestions(latest, previous, manualOverrides = null) {
    const c = buildContext(latest, previous, manualOverrides);
    const out = [];
    const add = (priority, category, option, rationale, cautions = "") => {
      out.push({ priority, category, option, rationale, cautions });
    };
    const applySelectionFilters = (items) => sortByPriority(items).filter(
      (item) => !isSupplyOptionExcluded({ category: item.category, treatment_option: item.option }) && isSuggestionEnabled(item.option),
    );
    const fallback = [
      {
        priority: "low",
        category: "General",
        option: "Continue current local wound care protocol",
        rationale: "No selected supply filters matched this wound context.",
        cautions: "Use full bedside assessment to refine product choice.",
      },
    ];
    const finalize = (items) => {
      const filtered = applySelectionFilters(items);
      if (filtered.length) {
        const guarded = applyCompatibilityGuardrails(filtered, c);
        if (guarded.length) return guarded;
      }

      const measurementFallback = applySelectionFilters(buildTypeMeasurementFallbackSuggestions(c));
      if (measurementFallback.length) {
        const guardedFallback = applyCompatibilityGuardrails(measurementFallback, c);
        return guardedFallback.length ? guardedFallback : measurementFallback;
      }
      return fallback;
    };

    if (c.isResolved || c.looksClosed) {
      add("low", "Maintenance", "Protective dressing / skin barrier and recurrence prevention", "Wound appears resolved or closed based on status/measurements.", "Continue pressure off-loading and routine skin checks.");
      if (!c.isResolved && c.looksClosed) {
        add("medium", "Documentation", "Chart consistency check", "Wound size is 0x0x0 but status is not marked resolved.", "Confirm wound status and treatment continuation plan.");
      }
      return finalize(out);
    }

    // ── Special pathway intercepts ────────────────────────────────────────
    if (c.necrotizingFasciitis) {
      add("high", "⚠ EMERGENCY", "SUSPECTED NECROTIZING FASCIITIS — activate emergency surgical consultation IMMEDIATELY", "NF is a surgical emergency with >30% mortality if delayed. Do NOT manage as routine wound care. Signs: rapidly spreading erythema, pain disproportionate to appearance, crepitus, gray/dishwater drainage, systemic sepsis.", "Call surgery NOW; initiate broad-spectrum IV antibiotics (cover gram-positive, gram-negative, and anaerobes); do not perform bedside debridement; NPO and IV access; imaging (CT with contrast) if available without delaying surgery.");
      add("high", "NF — Antibiotics", "Broad-spectrum IV antibiotics — vancomycin + piperacillin-tazobactam + clindamycin (anti-toxin) pending surgical cultures", "Empiric coverage should include MRSA, gram-negative organisms, and anaerobes. Clindamycin inhibits toxin production in streptococcal/clostridial NF.", "IDSA recommends early surgical consultation as the definitive intervention — antibiotics are adjunctive. Culture-guide as soon as intraoperative samples are available.");
      return finalize(out);
    }

    if (c.calciphylaxisWound) {
      add("high", "Calciphylaxis Management", "Sodium thiosulfate IV (highest evidence) — nephrology/wound specialist consultation required urgently", "Sodium thiosulfate (12.5-25g IV three times weekly with dialysis) has the strongest evidence for calciphylaxis wound healing. Mechanism: chelates calcium deposits, antioxidant. RCTs and large case series support use.", "Requires nephrology coordination for IV dosing with dialysis. Screen for bisulfite allergy. Cinacalcet/parathyroidectomy if hyperparathyroidism is driving the calcifications.");
      add("high", "Calciphylaxis — Avoid", "AVOID: calcium-containing phosphate binders, calcium-containing IV fluids, vitamin D analogs, warfarin if possible", "These agents worsen vascular calcification in calciphylaxis patients. Switch to sevelamer or lanthanum carbonate for phosphate binding. Consider warfarin → alternative anticoagulation (calciphylaxis is associated with protein C/S deficiency).", "Prescriber decision; requires nephrology and pharmacist coordination; do not change anticoagulation without specialist input.");
      add("medium", "Calciphylaxis — Local Wound", "Conservative wound care: pain management, gentle moisture balance, non-adherent dressings. Avoid surgical debridement in most cases.", "Calciphylaxis wounds have severely ischemic tissue. Surgical debridement typically creates larger non-healing defects. Conservative management with pain control and infection prevention is primary.", "Rare exception: infected calciphylaxis wounds may require limited surgical debridement — specialist decision only. Maggot debridement has limited case series evidence.");
      add("medium", "Calciphylaxis — Workup", "Check: PTH, calcium, phosphate, albumin, 25-OH Vitamin D, protein C/S, Factor V Leiden, lupus anticoagulant, warfarin use", "Identifying the driving factor is essential for targeted medical management. Secondary hyperparathyroidism and phosphate imbalance are the most common correctable triggers.", "Refer all calciphylaxis wounds to nephrology; consider hyperbaric oxygen if available.");
      return finalize(out);
    }

    if (c.malignantWound) {
      add("high", "Malignant/Fungating Wound — Goals", "Palliative management: comfort, odor control, exudate management, bleeding prevention. Do NOT aggressively debride without oncology order.", "Malignant wounds contain friable tumor vasculature and do not follow standard healing principles. Aggressive debridement causes uncontrolled hemorrhage and does not promote closure. Oncology must direct management goals.", "Confirm goals of care with patient, oncology, and palliative care before any procedural intervention.");
      add("high", "Odor Management", "Metronidazole gel (0.75-0.8%) topically applied to wound surface — anaerobic bacteria drive malignant wound odor", "Topical metronidazole effectively reduces odor from anaerobic bacterial activity in fungating wounds. Apply at each dressing change. Systemic metronidazole is an alternative if topical is not available.", "Activated charcoal secondary dressings also reduce odor at the dressing surface. Yogurt/buttermilk topical is a low-evidence folk alternative sometimes used in resource-limited settings.");
      add("medium", "Exudate Management", "Non-adherent foam or hydrofiber dressing for exudate control; activated charcoal layer for odor", "Malignant wounds often produce high exudate. Non-adherent dressings minimize trauma and bleeding at change. Activated charcoal secondary absorbs odor-causing volatile compounds.", "Avoid adhesive dressings on fragile peri-tumor skin; use silicone borders or foam straps. Never strip dressings — soak to loosen if adherent.");
      add("medium", "Bleeding Management", "Non-adherent primary dressing (Mepitel One); calcium alginate for active ooze; sucralfate paste or adrenaline-soaked gauze for significant bleeding", "Friable tumor vasculature bleeds easily. Non-adherent dressings prevent re-bleeding at change. Calcium alginate has hemostatic properties. Adrenaline-soaked gauze (1:1000) can temporize significant bleeding.", "Have emergency protocol for major hemorrhage from fungating wounds (dark towels, morphine for symptom management, patient/family education). Refer to palliative care team for bleeding risk discussion.");
      add("low", "Skin Protection", "Protect peri-wound skin from exudate with cyanoacrylate film or zinc barrier; patient/family education on wound care", "High exudate and friable skin around malignant wounds cause maceration and breakdown. Skin barrier application at each change maintains skin integrity.", "Patient and caregiver education on dressing technique, odor management, and when to call for clinical support is essential.");
      return finalize(out);
    }
    if (c.pyodermaGangrenosum) {
      add("high", "⚠ PG Safety Gate", "Pyoderma gangrenosum: DO NOT DEBRIDE — pathergy risk. Dermatology/rheumatology consult required.", "PG is an autoinflammatory neutrophilic dermatosis where debridement triggers rapid paradoxical wound enlargement (pathergy). Standard wound care principles are contraindicated.", "URGENT: stop any debridement plan; consult dermatology immediately; primary management is immunosuppressive.");
      add("high", "PG Management", "Corticosteroid therapy (topical, intralesional, or systemic) — specialist-directed", "Systemic corticosteroids (prednisolone 0.5-1 mg/kg/day) or cyclosporine are first-line systemic options. Topical/intralesional for smaller lesions. Anti-TNF biologics for refractory PG.", "Prescriber/specialist decision; screen for contraindications; monitor blood glucose, BP, and infection during systemic steroid use.");
      add("medium", "PG Wound Cover", "Non-adherent moisture-retaining dressing without debridement — comfort and protection only", "Cover wound to reduce pain and prevent secondary infection while immunosuppressive therapy takes effect. Avoid adhesives directly on PG lesion edges.", "Change gently; avoid any trauma to wound edges; patient should be on systemic therapy concurrently.");
      return finalize(out);
    }

    if (c.burnWound) {
      const isRadiationBurn = c.radiationWound;
      const burnClass = burnClassificationFromStage(latest.stage || "");
      const isFull = burnClass === "full_thickness";
      const isPartial = burnClass === "partial_thickness";
      const isSuperficial = burnClass === "superficial";

      if (isRadiationBurn) {
        add("high", "Radiation Burn Management", "Radiation burn requires conservative management — coordinate with radiation oncology and wound specialist before any debridement", "Radiation-damaged tissue has poor regenerative capacity compounded by thermal injury. Aggressive debridement risks non-healing defects.", "Do not debride without specialist planning; protect fragile tissue; refer urgently.");
      }

      if (isFull) {
        add("high", "Burns — Full-Thickness Escalation", "Full-thickness burn: urgent burn/surgical evaluation — likely requires excision and grafting", "Full-thickness classification (through dermis) indicates no spontaneous re-epithelialization. Burn center criteria almost always met. Escharotomy may be needed for circumferential burns.", "Assess neurovascular status and circumferential risk urgently; do not attempt local wound care as primary management.");
      } else if (isPartial) {
        add("high", "Burns — Partial-Thickness Initial Care", "Cool with running water 15-20 min (not ice); apply non-adherent antimicrobial dressing (e.g., Mepitel Ag, Aquacel Ag Burn)", "Partial-thickness burns can re-epithelialize spontaneously if managed to prevent infection and desiccation. Silver-containing non-adherent dressings reduce infection and dressing-change frequency vs. silver sulfadiazine.", "Reassess depth at 48-72 hours once edema resolves — partial may appear superficial initially; burns >5% TBSA, face/hands/feet/genitals/joints require burn center referral.");
        add("medium", "Burns — Blistering", "Intact blisters: leave intact if possible. Broken blisters: debride devitalized roof, cover with non-adherent dressing", "Intact blisters provide a sterile biological dressing. Deroofing large blisters increases infection risk and pain.", "Palms and soles: intact blisters impair function — refer to specialist.");
      } else if (isSuperficial) {
        add("medium", "Burns — Superficial Care", "Superficial burn: cooling, pain control, moisturizer or light non-adherent cover if needed", "Superficial burns (epidermal only) generally heal within 7-10 days without scarring with appropriate pain management and skin protection.", "Reassess if blistering, worsening pain, drainage, or infection signs appear — may be deeper than initial appearance.");
      } else {
        add("high", "Burns — Depth Assessment Required", "Assess burn depth (superficial / partial-thickness / full-thickness) and TBSA%; select burn classification in Stage field to refine guidance", "Depth classification drives the entire management pathway. Without it, generic guidance is applied and depth-specific interventions may be missed.", "Select burn depth in the Stage/Classification field to receive targeted recommendations.");
        add("high", "Burns — Referral Screening", "Screen for burn center criteria: >5% TBSA, full-thickness, face/hands/feet/genitals/joints, chemical/electrical, inhalation injury, circumferential limb", "ISBI/ABA criteria — delays in referral for major burns worsen outcome.", "Screen for inhalation injury: hoarse voice, facial burns, singed nasal hair, carbonaceous sputum.");
      }

      if (!isFull) {
        add("medium", "Burns — Infection Prevention", "Non-adherent antimicrobial dressing (silver-based or PHMB-impregnated) to reduce infection risk", "Infection is the primary complication of partial-thickness burns. Silver non-adherent dressings are superior to silver sulfadiazine for pain, change frequency, and healing time.", "Avoid silver sulfadiazine on facial or superficial burns; change outer secondary per saturation.");
      }

      add("low", "Burns — Follow-up", "Reassess at 48-72 hours — burn depth can change as edema resolves and demarcation clarifies", "Initial depth assessment is often inaccurate; serial reassessment is required to determine definitive management.", "Document depth changes at each visit; arrange timely specialist follow-up for any wound not healing within expected timeframe.");
      return finalize(out);
    }

    if (c.masdRelated) {
      add("high", "MASD/IAD Management", "pH-balanced gentle cleanser followed by high-TEWL barrier product (zinc oxide, dimethicone, or cyanoacrylate-based barrier)", "Structured skin care with pH-balanced cleansers preserves the acid mantle; barrier products protect against moisture/chemical injury from urine/feces. RCTs show >50% IAD incidence reduction with structured skin care protocols.", "Distinguish MASD from pressure injury — staging criteria differ (MASD does not stage by depth); avoid occlusive barriers on infected skin; address continence management concurrently.");
      add("medium", "MASD Continence", "Continence management assessment and plan — absorbent products, toileting schedule, catheter review", "Addressing the source of moisture is essential for MASD resolution; local treatment without continence management has limited effectiveness.", "Coordinate with continence nurse or urology/gynecology where appropriate.");
      add("medium", "MASD Skin Assessment", "Skin protection and reassessment at each care episode — document MASD type and severity", "Structured documentation using a validated tool (e.g., IAD Skin Condition Assessment Tool) enables trend monitoring and informs treatment adjustments.", "Screen for fungal superinfection (satellite lesions, white scaling) which requires antifungal treatment.");
      return finalize(out);
    }

    if (c.radiationWound && !c.burnWound) {
      const isORN = c.woundTypeText.includes("osteoradionecrosis") || c.woundTypeText.includes("orn") || (c.osteomyelitisSignal && c.woundTypeText.includes("radiation"));
      const isAcute = c.woundTypeText.includes("acute") || (c.woundAgeDays != null && c.woundAgeDays < 90);

      add("high", "⚠ Radiation Wound — Oncology Coordination", "Mandatory coordination with radiation oncology and/or surgical oncology before ANY debridement or procedural intervention", "Radiation-damaged tissue has progressive obliterative endarteritis causing permanent hypoxia and loss of regenerative capacity (Marx fibrosis-atrophy-hypoxia triad). Standard wound care principles fail in this tissue. Treatment decisions must account for prior total dose, fractionation, field, and time since last radiation.", "Document: cumulative radiation dose, date of last treatment, treatment field, whether wound was present pre-treatment or appeared post-treatment; this context determines pathway and intervention safety.");

      if (isORN) {
        add("high", "Osteoradionecrosis (ORN) — Marx HBOT Protocol", "Hyperbaric oxygen therapy: Marx protocol — 30 dives pre-operatively (100% O2 at 2.4 ATA, 90 min sessions) + 10 post-operatively if surgical debridement planned; 20-30 dives for non-surgical management", "HBOT is the cornerstone of ORN management. Marx's original RCT (1983) demonstrated significantly superior outcomes vs antibiotics alone. Mechanism: stimulates angiogenesis (VEGF/collagen) in hypoxic tissue, restores oxygen gradient for wound healing. Cochrane review supports use for jaw ORN (highest evidence); extrapolated to other sites.", "Contraindications: untreated pneumothorax, concurrent bleomycin/doxorubicin/cisplatin (check oncology), severe COPD; requires hyperbaric medicine consultation and chamber access; 20-40 total dives; each session approximately 2 hours.");
        add("high", "ORN — Surgical Planning", "Surgical debridement and reconstruction planning (sequestrectomy, ostectomy, or resection with vascularized flap) coordinated with HBOT course", "Non-perfused bone must be removed for healing to occur. Vascularized free flaps (fibula free flap for mandibular ORN; other sites vary) bring non-irradiated tissue and new vasculature into the radiation field. Timing relative to HBOT course is protocol-driven.", "Refer to head/neck oncology surgery or reconstructive surgery with radiation wound experience; HBOT pre/post-op improves flap take rates; plan multidisciplinary tumor board review.");
        add("medium", "ORN — Local Wound Management", "Conservative: non-adherent moisture-retaining primary dressing; gentle saline irrigation; protect exposed bone from trauma and desiccation; strict oral hygiene for jaw ORN", "Moist wound environment protects exposed bone from desiccation and secondary infection while definitive treatment is being arranged. Exposed bone that desiccates becomes infected and further necrotic.", "Avoid betadine on exposed bone; avoid pressure on exposed bone surfaces; soft diet if jaw ORN; gentle chlorhexidine rinse for oral ORN.");
        add("medium", "ORN — Pentoxifylline + Vitamin E (PENTOCLO)", "Consider pentoxifylline 400mg TID + vitamin E 1000 IU/day for early/minimal ORN or as adjunct; PENTOCLO adds clodronate for bone involvement", "PENTOCLO (pentoxifylline + tocopherol + clodronate) — pilot RCTs show regression of ORN in 20-50% of cases. Mechanism: pentoxifylline reduces fibrosis (TGF-beta blockade), vitamin E is antioxidant/anti-fibrotic, clodronate inhibits osteoclasts.", "Prescriber decision; treatment course typically 6-12 months; monitor CBC, renal function; pentoxifylline contraindicated in recent MI/stroke; coordinate with oncology.");
      } else if (isAcute) {
        add("high", "Acute Radiation Dermatitis — CTCAE Grading", "Grade per CTCAE v5.0: Grade 1 (faint erythema/dry desquamation) = emollients only. Grade 2 (moderate erythema/moist desquamation in folds) = non-adherent moisture dressings. Grade 3 (moist desquamation outside folds, pitting edema) = non-adherent silver/foam + radiation oncology review. Grade 4 (full-thickness necrosis/ulceration) = urgent specialist consult, possible treatment break.", "CTCAE grading drives management intensity. Grade 3-4 requires radiation oncology coordination — treatment breaks and dose modifications may be indicated. Premature or delayed escalation both cause harm.", "Obtain CTCAE grade from radiation oncology; document grade in wound notes; Grade 4 = urgent escalation; never debride Grade 3-4 without specialist direction.");
        add("high", "Acute Radiation Dermatitis — Dressing", "Grade 1-2: soft silicone non-adherent dressing (Mepitel One, Mepilex Lite) or hydrogel/petrolatum gauze for moist desquamation; emollient for dry erythema. Grade 3+: non-adherent soft silicone or hydrofiber dressing changed per saturation.", "RCT evidence (Diggelmann 2010, Wooding 2018) supports silicone-based non-adherent dressings over standard care for radiation dermatitis: less severe moist desquamation, better comfort, fewer treatment breaks. MASCC guidelines 2020 recommend mild soap/water cleansing and non-adherent dressings.", "Avoid adhesive dressings and tape on irradiated in-field skin; avoid friction/washcloths; avoid heating/cooling pads on field; avoid silver sulfadiazine as first-line — inferior pain scores and healing impairment vs silicone in RCTs.");
        add("medium", "Acute Radiation Dermatitis — Topical", "Emollient TID (non-perfumed: Aquaphor, DermaVeen) to reduce dry desquamation. Grade 2+ moist desquamation: topical corticosteroid (betamethasone 0.1% or mometasone) for pruritus/inflammation — with radiation oncology approval only.", "MASCC/ISOO systematic review: emollients reduce Grade 2+ dermatitis incidence. Topical corticosteroids (low-medium potency) reduce pruritus and inflammation. Avoid high-potency steroids on irradiated skin.", "Radiation oncology to direct topical steroid use; avoid cosmetics, perfumed products, and aluminum-containing antiperspirants within field during treatment.");
      } else {
        add("high", "Chronic Radiation Wound — Conservative First Line", "Non-adherent moisture-retaining primary dressing (silicone contact layer, hydrogel, soft foam); no aggressive debridement without specialist consultation", "Chronic radiation wounds have permanently impaired healing (Marx fibrosis-atrophy-hypoxia triad). Aggressive debridement creates non-healing surgical defects in this tissue. Conservative moisture balance is foundational.", "Document time since radiation, total dose if known; any debridement must be discussed with radiation oncology/wound surgery; avoid sharp/enzymatic debridement without specialist plan.");
        add("high", "Chronic Radiation Wound — HBOT Referral", "Referral to hyperbaric oxygen medicine for chronic soft tissue radiation necrosis or non-healing radiation wound", "HBOT (20-40 sessions at 2.4 ATA, 90 min each) promotes angiogenesis in hypoxic radiation tissue. Cochrane evidence supports use for radiation soft tissue necrosis.", "Contraindications: pneumothorax, bleomycin/doxorubicin/cisplatin (check oncology); requires hyperbaric medicine program; protocol determined by hyperbaric physician.");
        add("medium", "Chronic Radiation Wound — Pentoxifylline + Vitamin E", "Pentoxifylline 400mg TID + vitamin E (tocopherol) 1000 IU/day for 3-6 months — evidence-based adjunct for chronic radiation-induced fibrosis and soft tissue necrosis", "Randomized trial evidence (Lefaix 1999; Delanian 2003) shows pentoxifylline + vitamin E reduces radiation fibrosis and promotes late radiation tissue injury healing. Mechanism: pentoxifylline reduces TGF-beta-driven fibrosis; vitamin E provides antioxidant protection.", "Prescriber decision; contraindicated with recent MI or hemorrhagic stroke; monitor CBC and renal function; take with food to reduce GI side effects; duration 3-12 months based on response.");
        add("medium", "Chronic Radiation Wound — Infection Control", "Culture wound before antimicrobial dressings; treat overt infection with targeted antibiotics; non-antimicrobial dressings for clinically uninfected wounds", "Radiation wounds have impaired immune surveillance, making them infection-prone. Culture-guided treatment is essential — colonization alone is not an indication for systemic antibiotics.", "Treat clinical infection (fever, spreading erythema, purulent drainage) — not colonization alone; consult infectious disease for complex cases.");
        add("low", "Chronic Radiation Wound — NPWT Consideration", "NPWT as adjunct for larger radiation wounds with confirmed granulation tissue — specialist decision only", "NPWT may stimulate granulation in chronic radiation wounds with adequate tissue perfusion. However, application to poorly perfused radiation tissue without specialist assessment risks non-healing.", "Contraindicated over malignant wounds, exposed blood vessels, untreated osteomyelitis; only apply with vascular/wound surgeon assessment confirming adequate perfusion.");
      }

      add("low", "Radiation Wound — Nutrition Optimization", "Optimize nutrition: protein >=1.5 g/kg/day, vitamin C 500mg BID, zinc 220mg/day (if deficient), vitamin A supplementation for patients on systemic steroids", "Radiation causes systemic nutritional deficits that impair wound healing. High-quality protein provides substrate for collagen synthesis. Vitamin C and zinc are essential cofactors for wound healing enzymes.", "Dietitian consultation recommended; screen albumin, prealbumin, zinc levels; avoid megadosing fat-soluble vitamins beyond stated doses.");
      return finalize(out);
    }

    if (c.traumaticWound) {
      const isBite = c.woundTypeText.includes("bite");
      const loc = c.locationText || "";
      const isHand = loc.includes("hand") || loc.includes("finger") || loc.includes("digit") || loc.includes("thumb") || loc.includes("wrist");
      const isFace = loc.includes("face") || loc.includes("cheek") || loc.includes("lip") || loc.includes("forehead") || loc.includes("chin") || loc.includes("nose") || loc.includes("scalp") || loc.includes("eyelid") || loc.includes("periorbital");
      const isFoot = loc.includes("foot") || loc.includes("plantar") || loc.includes("toe") || loc.includes("ankle") || loc.includes("heel");

      add("high", "Traumatic Wound — Neurovascular & Depth Assessment", "Assess neurovascular status: sensation, 2-point discrimination (≤ 6 mm normal in fingertip), capillary refill (< 2 sec), distal pulses. Document wound depth and identify any exposed tendon, fascia, bone, or joint capsule. High-energy mechanisms (crush, blast, MVA): screen for compartment syndrome — pain with passive stretch, tense compartment, paresthesias; compartment pressure > 30 mmHg is surgical emergency.", "Depth assessment determines closure feasibility and referral urgency. Tendon and joint involvement require operative evaluation. Compartment syndrome can develop hours after injury — normal pulses do NOT exclude it. Missing a partial tendon laceration leads to delayed rupture.", "Document explicitly: sensation intact Y/N; capillary refill Y/N; deep structures identified Y/N; mechanism; time of injury.");
      add("high", "Traumatic Wound — Foreign Body", "Assess for retained foreign body: probe wound gently; X-ray if metallic/glass suspected; ultrasound or MRI for organic material (wood/plastic)", "Retained foreign bodies are the most common cause of traumatic wound infection and non-healing. Metallic objects are visible on plain X-ray; organic material requires ultrasound or MRI.", "Document foreign body assessment explicitly; if not ruled out, obtain imaging before closure.");
      add("high", "Traumatic Wound — Tetanus", "Verify tetanus prophylaxis: immune status + wound type + time since last booster — give Td/Tdap/TIG per current CDC protocol", "Clean minor wounds: Td if > 10 years. Dirty/contaminated wounds: Td if > 5 years. Unimmunized or unknown status: Td + TIG. Incomplete DTaP series: refer.", "Document immunization status and prophylaxis given; consult CDC tetanus guidelines for full decision tree.");
      add("high", "Traumatic Wound — Irrigation", "Irrigate copiously with normal saline under pressure (9-12 psi); minimum 50-100 mL per cm of wound depth", "High-pressure saline irrigation significantly reduces bacterial load. Bulb syringe is inadequate; use 18G angiocath on 35 mL syringe or irrigation shield.", "Do NOT use hydrogen peroxide, betadine, or Dakin solution for primary irrigation of fresh traumatic wounds — cytotoxic to viable tissue; normal saline is preferred.");
      if (isHand) {
        add("high", "Hand / Digit Wound — Specialty Referral", "Test each digit: active FDP flexion (DIP), FDS flexion (PIP with adjacent digits blocked), 2-point discrimination, capillary refill. Clenched-fist injuries over MCP joints (fight bites) are joint space contamination until proven otherwise — require operative irrigation. Partial flexor tendon lacerations are typically non-operative in the field; refer urgently for tendon exploration under tourniquet control.", "Partial flexor tendon lacerations appear functional but rupture with minimal force if untreated. Digital nerve injuries carry best prognosis with microsurgical repair within 72 hours. Fight bite MCP joint infections rapidly destroy cartilage.", "Splint in position of safe immobilization (intrinsic-plus: 70° MCP flexion, full IP extension, thumb abducted); do not attempt tendon repair outside OR; expedite hand surgery or orthopedic referral.");
      }
      if (isFace) {
        add("medium", "Facial Wound — Closure & Anatomic Landmarks", "Facial wounds can be closed up to 24 hours after injury (superior vascularity). Meticulous layered closure: dermis with absorbable 4-0, skin with 5-0 monofilament or fast-absorbing gut. Assess anatomic landmarks: parotid duct (deep cheek, level with ear tragus), facial nerve branches (test all 5 before closure), lacrimal duct (medial canthal wounds). Eyelid/periorbital injuries: ophthalmology consult. Scalp lacerations: staples acceptable; hemostasis critical (galea aponeurotic bleeds briskly).", "1 mm misalignment at the lip vermillion border or eyebrow is cosmetically visible. Facial nerve injury in cheek lacerations: if lateral to a vertical line through lateral canthus — medial branches have redundant innervation; lateral branches require exploration. Parotid duct injury: apply pressure to parotid, look for clear fluid in wound.", "Mark anatomic landmarks (vermillion border, eyebrow hairs) with ink before injecting local anesthetic — lidocaine distorts landmarks. Eyelid wounds may need lacrimal stenting — do not close blindly.");
      }
      if (isFoot) {
        add("medium", "Foot Wound — Imaging & Vascular Assessment", "Obtain plain X-ray: metatarsal fracture, Lisfranc injury, glass/metallic foreign body, occult cortical break. Assess vascular status (pedal pulses, ABI if concern). Plantar puncture wounds through shoe sole carry high Pseudomonas aeruginosa osteomyelitis risk — wound exploration ± ciprofloxacin for moderate/deep wounds. Diabetic foot: heightened infection risk, impaired healing, neuropathy masks pain — low threshold for imaging, culture, and broad-spectrum antibiotics.", "Lisfranc injuries are commonly missed on initial X-ray; weight-bearing films improve sensitivity. Pseudomonas plantar osteomyelitis typically presents 7-14 days post-injury with persistent plantar pain — MRI is gold standard. Diabetic patients can develop rapid-onset osteomyelitis with minimal external signs.", "Provide crutches/offloading; ensure tetanus current; document pedal pulses; if diabetic, document ABI and neurovascular baseline.");
      }
      if (isBite) {
        add("high", "Bite Wound", "Human bites: amoxicillin-clavulanate; delayed closure; report per jurisdiction. Dog bites: amoxicillin-clavulanate; primary closure if clean and < 8 hours. Cat bites: antibiotics always; usually delayed closure (high Pasteurella risk).", "Cat bite infection rate 30-50%. Human bites to dorsum of hand (clenched-fist) risk deep space infection and tendon sheath involvement — orthopedic/hand surgery consult.", "Assess rabies risk; report to public health per jurisdiction; X-ray joints near bite wounds for tooth fragment or fracture.");
      } else {
        add("medium", "Traumatic Wound — Closure Decision", "Primary closure (< 6-8 hours, clean): irrigate, debride non-viable edges, close. Delayed primary (contaminated or > 8 hours): pack open 3-4 days then close. Secondary intention: infected or heavily contaminated wounds.", "Golden period 6-8 hours for most wounds; facial wounds up to 24 hours due to superior vascularity. Contaminated, puncture, and bite wounds: leave open for delayed closure or secondary intention.", "Reassess wound edges at 48-72 hours for viability; document closure decision rationale.");
      }
      add("medium", "Traumatic Wound — Dressing", "Non-adherent primary dressing; moist wound environment for re-epithelialization post-irrigation", "After irrigation and debridement, maintain moist wound environment. Non-adherent contact layer prevents re-injury at dressing changes.", "Change at 24-48 hours initially; sooner if saturated or infection signs appear.");
      return finalize(out);
    }

    if (c.fistulaWound) {
      add("high", "Fistula — Output Classification", "Measure daily output: Low < 200 mL/day (dressings adequate), Moderate 200-500 mL/day (pouching system), High > 500 mL/day (pouching + IV support ± somatostatin analog)", "Output volume drives the entire management strategy. High-output ECFs cause rapid protein, fluid, and electrolyte depletion — can become life-threatening. Early classification prevents underestimation.", "Weigh soiled pouching system; document output character (enteric = brown/odorous, pancreatic = watery/clear, biliary = green/yellow-brown); record daily volumes.");
      add("high", "Fistula — Type Identification (Enteric / Pancreatic / Biliary)", "Classify type from output character and lab testing: Enteric/small bowel — brown/odorous, high enzyme activity, increases with oral intake. Pancreatic — watery and clear; send fistula fluid for amylase (> 3× serum amylase confirms pancreatic origin). Biliary — green to yellow-brown; send for bilirubin (elevated confirms biliary source). Mixed presentations require CT fistulography or contrast upper GI series to define tract anatomy.", "Type determines pharmacologic strategy: pancreatic fistulas respond best to somatostatin analogs + bowel rest; biliary fistulas may be managed with ERCP + stenting to divert bile; enteric fistulas often require TPN + NPO to reduce luminal output. Misidentification leads to wrong treatment. Urinoma mimics biliary — send for creatinine to exclude.", "CT with fistulography or sinogram to define tract: entry point, length, epithelialization, connection to bowel. Report: volume, character, lab results, tract anatomy to GI/surgery at referral.");
      add("high", "Fistula — Skin Protection", "Pouching system (convex or flat wafer with barrier ring) is superior to dressings for moderate/high output. Apply extended-wear barrier (cyanoacrylate film, Cavilon, zinc oxide paste) for low output.", "Intestinal effluent contains active digestive enzymes causing rapid, painful skin breakdown. Pouching contains output, protects skin, and enables accurate output measurement.", "CWOCN (certified wound/ostomy nurse) consultation strongly recommended for pouch fitting; proper skin prep and wafer adhesion critical to prevent leakage and breakdown.");
      add("high", "Fistula — Nutrition & Electrolyte Replacement", "Urgent dietitian consult: assess protein, caloric, fluid, and electrolyte needs. Target 1.5-2.5 g/kg/day protein; 25-35 kcal/kg/day total. Enteral nutrition via tube placed distal to fistula is preferred over TPN when feasible — preserves gut mucosa, reduces infection risk, lower cost. TPN indications: proximal small bowel fistula increasing output with enteral feeds, distal obstruction, hemodynamic instability.", "High-output ECFs cause significant losses of sodium, potassium, bicarbonate, magnesium, and zinc. Malnutrition is the primary factor impairing spontaneous fistula closure — albumin < 2.5 g/dL predicts failure. Enteral nutrition is NOT contraindicated in all fistulas — only when feeding worsens output or bowel rest is required for type-specific reasons.", "Monitor daily electrolytes and replace aggressively. Supplement: zinc 25-40 mg/day (critical for wound healing), magnesium IV if < 1.5 mg/dL, B12 if distal ileum involved. Document albumin/pre-albumin weekly as nutritional marker.");
      add("high", "Fistula — Bowel Rest / NPO Criteria", "Initiate NPO + TPN for: (1) High-output ECF (> 500 mL/day) not controlled by dietary modification; (2) Proximal small bowel or pancreatic fistula where oral/enteral feeding directly increases output; (3) Distal bowel obstruction requiring decompression. Confirm TPN requires central venous access (PICC or tunneled catheter). Target glucose 140-180 mg/dL.", "Bowel rest reduces pancreatic and intestinal secretions; combined with somatostatin may increase spontaneous closure rate. TPN is NOT beneficial for colonic fistulas (output is bacterial, not secretory). Duration of bowel rest should be re-evaluated weekly — prolonged NPO causes gut mucosal atrophy and bacterial translocation.", "Monitor for TPN complications: CLABSI (daily line site inspection), hyperglycemia, hypertriglyceridemia, hepatic dysfunction (LFTs weekly). Begin transition to enteral/oral as soon as output falls below threshold.");
      add("medium", "Fistula — Somatostatin Analog (Octreotide)", "For high-output pancreatic or proximal small bowel fistulas: Octreotide 100-200 mcg SC TID or 25-50 mcg/hr continuous IV infusion. Measure daily output — expect 30-50% reduction within 48-72 hours if response will occur. Lanreotide LAR 120 mg IM monthly for prolonged therapy. Discontinue if no ≥ 50% output reduction after 72 hours.", "Somatostatin analogs inhibit secretin, CCK, and gastrin; reduce pancreatic, gastric, and intestinal secretions. Meta-analyses (Hernandez-Aranda 1996, Sancho et al.) show faster time-to-closure for pancreatic fistulas but inconsistent effect on overall closure rate. Most effective when initiated within 48 hours of fistula identification.", "Monitor blood glucose — somatostatin inhibits both insulin and glucagon; hypoglycemia and hyperglycemia both possible. Not indicated for colonic fistulas. Insurance/formulary: lanreotide may require prior authorization; octreotide is widely available and first-line.");
      add("medium", "Fistula — Spontaneous Closure (SNAP Assessment)", "Assess SNAP factors for closure potential: Sepsis (active uncontrolled infection), Nutrition (malnutrition, albumin < 2.5), Anatomy (radiation damage, distal obstruction, foreign body in tract, short tract < 2 cm, fully epithelialized tract), Plan (no plan for surgical source control). Absence of SNAP barriers: 30-90 day spontaneous closure expected in 60-70% of ECFs with optimal conservative management.", "SNAP criteria predict failure to close spontaneously. Optimizing correctable SNAP factors (draining sepsis, restoring nutrition, relieving partial distal obstruction endoscopically) before surgery significantly improves operative outcomes and may enable spontaneous closure that would otherwise fail.", "Surgical consultation should be made early even if conservative management is ongoing — complex fistulas need multidisciplinary planning (surgery, GI, nutrition, CWOCN). Document referral made.");
      add("medium", "Fistula — Infection Control", "Culture fistula output; treat associated abscess or cellulitis aggressively; CT scan if deep abscess suspected", "Peri-fistula sepsis is the primary cause of fistula-related mortality. Abscess must be drained (percutaneously or surgically) before spontaneous closure can occur — pus prevents re-epithelialization.", "Broad-spectrum antibiotic coverage initially; de-escalate per culture and sensitivities; drain any fluctuant or CT-confirmed abscess urgently. Treat perifistula cellulitis with IV antibiotics if systemically ill.");
      add("medium", "Fistula — Surgical Timing & Indications", "Urgent/emergent surgery: hemodynamic instability from uncontrolled sepsis, bowel ischemia, or distal obstruction not amenable to endoscopic management. Elective surgery timing: after 8-12 weeks of optimized conservative management, with albumin > 3.0 g/dL, pre-albumin > 16 mg/dL, and source sepsis controlled. Biliary fistulas: ERCP with sphincterotomy ± stenting can divert bile and facilitate closure without laparotomy.", "Operating on an acutely inflamed, poorly nourished patient dramatically increases anastomotic leak rate (> 40% if albumin < 2.5) and operative mortality. Dense adhesions from prior surgery + fistula inflammation make re-operation technically high-risk — experienced colorectal or hepatobiliary surgeon essential. Timing after previous laparotomy: minimum 3-6 months to allow adhesion maturation.", "Confirm all SNAP barriers addressed before scheduling elective repair. Obtain cross-sectional imaging (CT with contrast) immediately pre-operatively to define anatomy. Bowel prep per surgeon preference. ICU-level post-operative monitoring if high-output or complex fistula.");
      return finalize(out);
    }

    if (c.skinTear) {
      const istap = normalizeText(latest.stage || "");
      const isType1 = istap.includes("type 1") || istap.includes("1");
      const isType2 = istap.includes("type 2") || istap.includes("2");
      const isType3 = istap.includes("type 3") || istap.includes("3");
      add("high", "Skin Tear — Flap Management", "Realign skin flap (if present) gently with gloved finger or moist cotton tip; mark flap direction with arrow on dressing", "ISTAP guidelines: preserve the skin flap whenever possible — it acts as a biological dressing and reduces healing time. Marking direction of flap on outer dressing prevents accidental tearing at removal.", "Never forcibly reposition a flap against resistance; if flap is non-viable (grey/black/non-blanchable), document and consult for conservative management.");
      if (isType1) {
        add("high", "ISTAP Type 1 — No Skin Loss", "Non-adherent silicone contact layer (e.g., Mepitel One) with soft bordered foam secondary; change every 3-7 days per saturation", "Type 1: flap intact. Goal is to maintain flap position and prevent re-injury. Silicone contact layer allows atraumatic changes without disturbing healing. RCT evidence for silicone vs standard dressings in skin tears.", "Educate patient on direction arrow to remove dressing without re-tearing; assess for causative factors (thin peri-wound skin, shear, moisture).");
      } else if (isType2) {
        add("high", "ISTAP Type 2 — Partial Flap Loss", "Non-adherent silicone primary + absorptive foam secondary; protect peri-wound with skin barrier film", "Type 2: partial flap loss exposes some dermis. Maintain remaining flap position and protect exposed wound bed. Moisture balance critical — partial thickness wounds require hydration without maceration.", "Reassess for Type 3 conversion at next change; protect fragile surrounding skin with silicone border or cyanoacrylate film.");
      } else if (isType3) {
        add("high", "ISTAP Type 3 — Total Flap Loss", "Moisture-retaining non-adherent dressing (e.g., foam, hydrocolloid, hydrogel-impregnated contact layer) for re-epithelialization", "Type 3: flap entirely absent. Wound must re-epithelialize from wound edges. Moist wound healing environment is essential. Expected healing time 2-4 weeks for small wounds in healthy skin.", "Monitor for infection signs; consider low-adherent silver dressing if bioburden concern; consider skin substitute/NPWT for large Type 3 tears in high-risk patients.");
      } else {
        add("high", "Skin Tear — Classify with ISTAP", "Select ISTAP classification in Stage field (Type 1/2/3) to receive specific guidance. Apply non-adherent silicone dressing as a safe starting point.", "ISTAP classification drives dressing selection and expected healing trajectory. All skin tears benefit from non-adherent primary dressings and peri-wound skin protection.", "Mark flap direction on dressing regardless of type.");
      }
      add("medium", "Skin Tear — Peri-wound Protection", "Skin barrier film or silicone border dressing to protect fragile surrounding skin", "Peri-wound skin in elderly patients is thin, fragile, and vulnerable to shear. Barrier film prevents adhesive-related tears. Silicone border dressings eliminate tape contact.", "Identify and address causative factors: furniture edge padding, moisture management, assistive device review, long-sleeve protective clothing.");
      add("low", "Skin Tear — Prevention", "Skin moisturizer BID to surrounding tissue; protective padding on at-risk areas; review equipment for sharp edges", "Skin hydration improves resilience. ISTAP prevention guidelines recommend emollient application, equipment padding, and fall/shear risk reduction.", "Document skin tear history — recurrence risk is high. Consider referral to occupational therapy for environmental modification.");
      return finalize(out);
    }
    if (c.surgicalWound) {
      const stageText2 = normalizeText(latest.stage || "");
      const isDehiscence = c.woundTypeText.includes("dehiscence") || stageText2.includes("dehiscence");
      const hasInfection = c.effectiveInfectionSigns.length > 0 || c.potentialBioburden;
      const isFascialEmergency = c.woundTypeText.includes("fascial") || c.woundTypeText.includes("evisceration") || c.woundTypeText.includes("eviscer");

      if (isFascialEmergency) {
        add("high", "⚠ SURGICAL EMERGENCY — Fascial Dehiscence/Evisceration", "FASCIAL DEHISCENCE OR EVISCERATION: Cover wound with moist sterile dressing and call surgery IMMEDIATELY — this is a surgical emergency requiring operative closure", "Full fascial dehiscence with evisceration has ~10-40% mortality if not promptly returned to OR. Do not attempt to push viscera back manually. Moist sterile dressing prevents bowel desiccation during emergency transfer.", "Do NOT apply pressure; do NOT push contents back; keep patient supine with knees bent; IV access and NPO immediately; call surgical team STAT.");
      } else if (hasInfection) {
        add("high", "Surgical Wound — Infected Dehiscence", "Infected surgical wound dehiscence: open wound to level of healthy tissue, culture wound bed, irrigate copiously, pack open — do NOT close over infection", "Closing over an infected surgical wound creates abscess cavity and risks fascial dehiscence or systemic sepsis. The wound must heal from the base. Serial debridement and negative pressure wound therapy (NPWT) are mainstays of treatment for infected sternal and abdominal wounds.", "Consult surgery for any suspected deep space infection (Levenson criteria: fever, wound discharge >5 days post-op, erythema >3 cm from incision); blood cultures if systemic signs present; CT with contrast for suspected abdominal/sternal deep infection.");
        add("high", "Surgical Wound — Infection Management", "Culture-guided antibiotics: wound and blood cultures before starting antibiotics. Empiric: amoxicillin-clavulanate (superficial), piperacillin-tazobactam or cefazolin + metronidazole (deep/abdominal). Add vancomycin if MRSA risk factors or prior MRSA.", "IDSA guidelines for surgical site infections: superficial SSI — oral antibiotics + wound opening. Deep SSI — IV antibiotics + operative debridement. Organ/space SSI — CT-guided drainage or re-operation.", "De-escalate antibiotics per culture sensitivities; duration guided by infection depth and response; add antifungal (fluconazole) if Candida isolated or immunocompromised patient.");
        add("medium", "Infected Surgical Wound — NPWT", "Negative pressure wound therapy (NPWT) after initial debridement for deep infected dehiscence — particularly sternal wounds, abdominal wounds", "NPWT reduces bacterial burden, promotes granulation tissue, draws wound edges together, and reduces time to secondary closure or skin grafting. Strongest evidence for sternal dehiscence (DSWI) and large abdominal wall wounds.", "Contraindicated over exposed bowel without protective interface layer; obtain surgery clearance before applying; change dressings every 48-72 hours; seal edges carefully to maintain negative pressure.");
        add("medium", "Infected Surgical Wound — Debridement", "Sharp debridement of all non-viable tissue at wound opening; remove any suture material acting as nidus of infection", "Retained suture material, mesh, and necrotic tissue maintain biofilm and prevent healing. Serial sharp debridement is required until a clean granulating base is achieved.", "Consult surgery for debridement of any tissue near major vessels or bowel; do not debride near mesh without surgeon guidance — mesh removal may be required for sterilization.");
      } else {
        add("high", "Surgical Wound — Sterile Dehiscence", "Sterile dehiscence (no infection): assess depth, irrigate with normal saline, pack with non-adherent moisture-retaining dressing — wound should heal by secondary intention or delayed primary closure", "Sterile wound dehiscence without deep space involvement heals well by secondary intention with moist wound care. Delayed primary closure (suturing at 4-5 days once clean bed is established) is an option for linear dehiscences.", "Rule out deep space infection with CT if any fever, leukocytosis, or discharge beyond day 5 post-op; confirm fascial integrity clinically before deciding on secondary intention vs. delayed closure.");
        add("medium", "Surgical Wound — Dressing Selection", "Moist non-adherent primary dressing (hydrogel, foam, or silicone contact layer); NPWT if wound is deep or wide with adequate granulation", "Moist wound environment supports re-epithelialization and granulation. NPWT is superior to standard dressings for surgical wounds with significant cavity depth (reduces time to closure and secondary intervention rate).", "Change every 2-3 days for non-NPWT dressings; sooner if saturated; assess for dehiscence propagation or new infection signs at each change.");
        add("medium", "Surgical Wound — NPWT for Sterile Deep Dehiscence", "NPWT (negative pressure wound therapy) at -75 to -125 mmHg for deep cavity without infection — promotes granulation and reduces time to closure", "Strong RCT evidence for NPWT in surgical wounds: APACHE trial and Cochrane review demonstrate reduced dehiscence area and time to closure vs standard dressings for deep surgical wounds.", "Document wound cavity dimensions; confirm no exposed bowel/vessels before application; consult surgery for large abdominal or sternal wounds.");
      }
      add("low", "Surgical Wound — Incisional NPWT (Prophylactic)", "Incisional NPWT (iNPWT) — consider for high-risk closures: obese patients, contaminated fields, re-do procedures, sternotomy", "iNPWT on closed incisions reduces SSI rate and dehiscence in high-risk patients (RCT evidence in cardiac surgery, colorectal, and orthopedic). Applied over closed incision for 5-7 days post-op.", "Surgeon-directed decision at time of closure; most effective when applied in OR immediately post-closure; requires clean closed incision — not for open wounds.");
      add("low", "Surgical Wound — Nutrition", "Protein >= 1.5 g/kg/day; screen for malnutrition (albumin, prealbumin, BMI); dietitian referral for malnourished patients", "Malnutrition is a primary driver of surgical wound dehiscence and SSI. Adequate protein intake is required for collagen synthesis and immune function.", "Immunonutrition (arginine, omega-3 supplementation) reduces SSI in high-risk surgical patients (ESPEN guidelines); dietitian-directed supplementation preferred over routine supplementation.");
      return finalize(out);
    }

    if (c.osteomyelitisWound && !c.radiationWound) {
      add("high", "⚠ Osteomyelitis — Diagnosis First", "Confirm osteomyelitis diagnosis before committing to a treatment pathway: probe-to-bone test (sensitivity ~60%, specificity ~91% in DFU), MRI (modality of choice: sensitivity 90%, specificity 83%), bone biopsy for culture and histology (GOLD STANDARD)", "Osteomyelitis is often clinically suspected but radiographically underdiagnosed or misdiagnosed. Plain X-ray findings lag bone destruction by 10-21 days and miss early disease. MRI provides the best soft tissue and marrow imaging. Bone biopsy provides pathogen identification for antibiotic targeting — empiric long-course antibiotics without culture guidance leads to treatment failure and resistance.", "Do NOT start antibiotics before bone biopsy if surgery is being planned — pre-biopsy antibiotics suppress culture yield; plain X-ray positive predictive value is low early; MRI may be contraindicated with certain implants.");
      add("high", "Osteomyelitis — Surgical Consultation", "Orthopedic or vascular surgery consultation for: extent of bone involvement, resection planning, and assessment for revascularization need (especially in DFU with osteomyelitis)", "Surgical debridement of necrotic bone (sequestrectomy) is often required for cure. In diabetic foot osteomyelitis, surgical bone resection achieves remission in >80% of cases vs ~60% with antibiotics alone (meta-analysis). Limb-threatening ischemia with osteomyelitis requires vascular surgery involvement.", "Surgery for osteomyelitis should include: excision of sinus tracts, removal of all sequestra, and obtaining intraoperative cultures. Consider vascularized flap or bone graft for large defects.");
      add("high", "Osteomyelitis — Antibiotic Therapy", "6 weeks of targeted IV or highly bioavailable oral antibiotics after bone debridement (or 3 months if no surgery). Coverage per bone biopsy culture. Empiric: MSSA — nafcillin or cefazolin; MRSA — vancomycin; gram-negative — ciprofloxacin or ceftriaxone; polymicrobial DFU — piperacillin-tazobactam + vancomycin initially.", "IDSA guidelines recommend 6 weeks of antibiotic therapy post-debridement for hematogenous osteomyelitis; 3 months for contiguous-focus without surgery. Highly bioavailable oral options (fluoroquinolones, rifampin, TMP-SMX) are non-inferior to IV for susceptible organisms in OVIVA trial.", "Infectious disease (ID) consultation essential for antibiotic selection, OPAT planning, and therapy duration; monitor CBC, CMP, inflammatory markers (ESR/CRP) during treatment; rifampin should NEVER be used as monotherapy — always combined.");
      add("high", "Osteomyelitis — Local Wound Care", "Maintain moist wound environment over bone; non-adherent primary dressing; protect exposed bone from desiccation; no hydrogen peroxide or betadine on exposed bone", "Exposed bone in osteomyelitis must be protected from desiccation while antibiotic therapy and surgical planning proceed. Desiccated bone becomes further necrotic and expands the surgical resection required.", "Saline-moistened non-adherent gauze or hydrogel is appropriate primary cover; change as saturated; if large cavity, NPWT may be used after surgical debridement — consult surgery before applying.");
      add("medium", "Osteomyelitis — Hyperbaric Oxygen Adjunct", "HBOT as adjunct consideration for chronic refractory osteomyelitis not responding to standard surgical + antibiotic therapy", "HBOT raises tissue oxygen tension in hypoxic infected bone, enhancing osteoclast-mediated sequestrum resorption, antibiotic efficacy, and immune function. Cochrane review and UHMS position statement support use for chronic refractory osteomyelitis.", "HBOT is adjunctive — not a replacement for surgery + antibiotics; 20-40 sessions; requires hyperbaric medicine referral; strongest evidence for chronic Stage III/IV osteomyelitis (Cierny-Mader classification).");
      add("medium", "Osteomyelitis — Monitoring", "Monitor ESR, CRP, and CBC every 2 weeks during antibiotic therapy; MRI at 6 weeks post-treatment to confirm resolution; watch for relapse signs for 12 months", "ESR normalizes slowly (weeks to months) even with effective treatment — CRP is a better early marker of response. Failure of CRP to decline by week 4 of therapy should trigger reassessment for resistant organism, retained hardware, or sequestrum.", "Sustained ESR/CRP elevation warrants repeat imaging and ID consultation; antibiotic-related complications (renal toxicity with vancomycin, GI effects, C. difficile) must be monitored during prolonged courses.");
      add("low", "Osteomyelitis — Diabetic Foot Considerations", "In DFU + osteomyelitis: optimize glycemic control (HbA1c target <7% when feasible); off-loading mandatory; vascular assessment for ABI/TBI; consider primary bone resection if toe/forefoot involvement", "Glycemic control is an independent predictor of osteomyelitis resolution. Off-loading is mandatory during treatment to prevent pressure-mediated bone damage. Primary surgical resection for toe/forefoot DFU osteomyelitis achieves high remission rates and avoids prolonged IV antibiotics.", "IWGDF guidelines recommend against antibiotic-alone treatment when surgical debridement is feasible; ensure adequate vascular supply before any bone surgery; consult vascular surgery for ABI < 0.6 or TBI < 0.7 with planned foot surgery.");
      return finalize(out);
    }

    if (c.vasculiticUlcer) {
      add("high", "⚠ Vasculitic Ulcer — Urgent Systemic Workup", "URGENT rheumatology/dermatology referral and systemic workup: punch biopsy of wound edge (not base), ANCA, ANA, anti-dsDNA, complement C3/C4, cryoglobulins, hepatitis B/C serology, RF, anti-CCP, ESR, CRP, CBC with differential, UA with microscopy", "Vasculitic ulcers are the cutaneous manifestation of systemic small/medium vessel inflammation. Untreated vasculitis causes progressive organ damage (renal, pulmonary, neurologic). Wound healing is impossible without treating the underlying disease. Punch biopsy of the active erythematous border (not the ulcer base) is required for direct immunofluorescence and histopathology.", "Do NOT start immunosuppression before biopsy; ANCA+ disease with renal involvement is a rheumatologic emergency — check urinalysis and creatinine immediately; PR3-ANCA (GPA) and MPO-ANCA (MPA/EGPA) guide specific treatment pathways.");
      add("high", "Vasculitic Ulcer — Immunosuppressive Therapy", "Systemic immunosuppression per specialist direction: systemic corticosteroids (prednisolone 0.5-1 mg/kg/day) as induction in most forms; add cyclophosphamide or rituximab for ANCA+ vasculitis, severe leukocytoclastic vasculitis, or cryoglobulinemic vasculitis", "Wound healing in vasculitis is gated by systemic disease control. Dressings and local wound care are supportive only. RAVE trial (rituximab vs cyclophosphamide for ANCA vasculitis): equivalent remission, superior for relapsing disease. Cochrane review supports rituximab for granulomatosis with polyangiitis.", "Specialist decision for all immunosuppression; screen for infection before starting (TB, hepatitis B, C, HIV); monitor CBC, CMP, urinalysis, ANCA titers during treatment; PJP prophylaxis (TMP-SMX) for cyclophosphamide regimens.");
      add("high", "Vasculitic Ulcer — NO Compression", "Do NOT apply compression therapy to vasculitic ulcers — compression may worsen ischemic damage in inflamed vessels", "Unlike venous ulcers, vasculitic ulcers have underlying vessel wall inflammation with reduced perfusion. Compression restricts already-compromised flow and can cause critical ischemia.", "Avoid all forms of compression (bandages, stockings, boot therapies) unless explicitly directed by the managing rheumatologist after perfusion assessment.");
      add("medium", "Vasculitic Ulcer — Local Wound Care", "Conservative wound care: non-adherent moisture-retaining primary dressing; gentle saline irrigation; treat secondary infection only per culture; avoid aggressive debridement until systemic disease is controlled", "Local wound care is supportive while systemic immunosuppressive therapy takes effect. Aggressive debridement of a vasculitic ulcer causes pathergy-like expansion and does not promote healing without systemic disease control.", "Debridement decisions require rheumatology clearance; avoid any wound care that causes significant trauma to wound edges; secondary infection should be confirmed by culture before antibiotic treatment.");
      add("medium", "Vasculitic Ulcer — Pain Management", "Vasculitic ulcers are disproportionately painful — structured pain management required: topical lidocaine gel at dressing changes; systemic analgesia per pain scale; consider gabapentinoid for neuropathic component", "Pain from vasculitic ulcers is driven by ischemia, inflammation, and nerve involvement. Inadequate pain control impairs patient cooperation with wound care, compromises quality of life, and is an independent marker of disease activity.", "Opioid-sparing multimodal approach preferred; topical EMLA or lidocaine 2-4% gel applied 20-30 min before dressing changes significantly reduces procedural pain; gabapentin or pregabalin for burning/neuropathic quality pain.");
      add("low", "Vasculitic Ulcer — Biologic Therapy Consideration", "For refractory or relapsing cutaneous vasculitis: rituximab (ANCA+), intravenous immunoglobulin (IVIg) for cryoglobulinemic, dapsone or colchicine for chronic leukocytoclastic vasculitis — specialist-directed", "Multiple biologics and adjunctive immunomodulators have evidence for specific vasculitis subtypes. Rituximab is now preferred over cyclophosphamide for PR3-ANCA vasculitis in most protocols. IVIg is used for severe cryoglobulinemic vasculitis not responding to rituximab + corticosteroids.", "All biologic decisions require rheumatology direction; screen for contraindications before each agent; monitor for infusion reactions and secondary infections.");
      return finalize(out);
    }

    if (c.martorell) {
      add("high", "⚠ Martorell Ulcer (HILU) — Hypertension Control MANDATORY", "Target blood pressure < 130/80 mmHg (lower if tolerated): urgent hypertension intensification is the primary treatment — without BP control, healing is impossible. Refer to internal medicine/cardiology for urgent medication optimization.", "Martorell hypertensive ischemic leg ulcer (HILU) is caused by arteriolar calcification (Monckeberg sclerosis) in the subcutaneous vasculature, leading to ischemic necrosis of the skin. It is exclusively driven by poorly controlled hypertension. BP control is the only disease-modifying intervention available.", "Document current antihypertensives; systolic >140 mmHg predicts non-healing regardless of wound care; target systolic <130 mmHg; add/uptitrate calcium channel blockers, ACE inhibitors, or ARBs with physician collaboration; 24-hour BP monitoring preferred to snapshot readings.");
      add("high", "Martorell Ulcer — Calcium Channel Blocker", "Calcium channel blocker (CCB: amlodipine, nifedipine extended-release) — first-line addition or uptitration for HILU management, beyond general BP effect", "CCBs have a specific vasodilatory effect on the arteriolar spasm that contributes to HILU ischemia, beyond their antihypertensive properties. Multiple case series demonstrate improved healing rates with CCB-containing antihypertensive regimens in HILU.", "Physician/prescriber decision; check for CCB contraindications (severe aortic stenosis, decompensated heart failure with reduced EF, hypotension); monitor for peripheral edema and flushing; do not use short-acting nifedipine — extended-release only.");
      add("high", "Martorell Ulcer — Pain Management (Mandatory)", "Pain management is a mandatory part of HILU care — these wounds are among the most painful in wound care: scheduled analgesics (not PRN), topical lidocaine or EMLA before dressing changes, gabapentinoid for neuropathic component", "HILU pain scores frequently exceed 8/10 at rest and 10/10 with dressing changes. Pain drives non-adherence, insomnia, and depression. Inadequate pain management is the most common reason for care failure in HILU. Pain assessment and management must be documented at every visit.", "Topical EMLA or lidocaine 4% gel 20-30 min before dressing changes; scheduled acetaminophen + NSAID (if renal function allows) as base; opioid analgesic for breakthrough as needed; gabapentin/pregabalin starting doses for burning pain; palliative care referral for refractory pain.");
      add("high", "Martorell Ulcer — NO Compression", "Do NOT apply compression therapy — HILU involves arteriolar ischemia, not venous hypertension; compression worsens ischemic injury", "HILU is caused by arteriolar occlusion and skin ischemia, not venous insufficiency. Compression increases ischemic load in already-compromised tissue and is an absolute contraindication in HILU. This is a critical diagnostic pitfall — HILU may mimic venous ulcers in location (lateral lower leg) but has a completely different pathophysiology.", "Confirm ABI/TBI before any lower extremity wound compression; ABI in HILU may be falsely normal (Monckeberg calcification makes vessels non-compressible); TBI or toe pressure is more reliable; compression is contraindicated with toe pressure < 60 mmHg.");
      add("medium", "Martorell Ulcer — HBOT Adjunct", "Hyperbaric oxygen therapy referral for HILU that fails to progress despite BP control and standard wound care — typically 20-30 sessions", "HBOT raises tissue oxygen tension in the ischemic subcutaneous tissue of HILU wounds. Case series and retrospective studies (Tawfick 2013, multiple European cohorts) report significant healing improvement with HBOT as adjunct to BP control.", "Requires hyperbaric medicine center referral; contraindications: untreated pneumothorax, certain medications; most effective when initiated after BP control is optimized; confirm with hyperbaric physician on session count and protocol.");
      add("medium", "Martorell Ulcer — Debridement", "Surgical or sharp debridement of necrotic tissue ONLY after: (1) BP target is achieved or under active intensification, (2) pain is adequately controlled, (3) vascular assessment confirms no critical ischemia", "HILU necrotic tissue requires debridement for wound bed preparation, but premature debridement before hemodynamic stabilization causes progressive necrosis. Pain-controlled surgical debridement under anesthesia may be appropriate for large HILU wounds.", "Do NOT debride HILU wounds with any ischemia (ABI < 0.5, toe pressure < 30 mmHg) without vascular surgery clearance; maggot debridement therapy has limited case series evidence for HILU; consult surgery for large necrotic HILU wounds before debridement.");
      add("low", "Martorell Ulcer — Local Wound Care", "Moist wound environment: non-adherent primary dressing (silicone contact layer, hydrogel) + absorptive secondary per drainage; protect fragile peri-wound skin; no adhesives directly on wound edges", "HILU wounds heal slowly even with optimal systemic management. Conservative moist wound care prevents desiccation and secondary infection while systemic BP control takes effect (healing may require months).", "Change frequency: every 48-72 hours or per saturation; assess peri-wound skin at every change for new ischemic lesions; document wound measurements and pain scores at each visit; wound should not be expected to change rapidly in early weeks of BP optimization.");
      return finalize(out);
    }

    if (c.hidradenitisSuppurativa) {
      const stage = normalizeText(latest.stage || "");
      const isHurley1 = stage.includes("hurley stage i") || stage.includes("hurley i") || (stage.includes("stage i") && !stage.includes("ii"));
      const isHurley2 = stage.includes("hurley stage ii") || stage.includes("hurley ii");
      const isHurley3 = stage.includes("hurley stage iii") || stage.includes("hurley iii");

      add("high", "Hidradenitis Suppurativa — Dermatology Consultation", "Dermatology (HS specialist if available) consultation for Hurley staging confirmation, biologic therapy assessment, and long-term management planning", "HS is a chronic autoinflammatory disease requiring systemic treatment for Hurley II-III disease. Local wound care alone does not alter disease course. Adalimumab is the only FDA-approved biologic for HS (PIONEER I/II trials). Early specialist involvement reduces tunneling progression and permanent scarring.", "Dermatology should lead systemic therapy decisions; assess for IBD, metabolic syndrome, spondyloarthropathy, and PCOS as HS comorbidities; smoking cessation is a disease-modifying intervention.");

      if (isHurley1) {
        add("high", "HS Hurley Stage I — Acute Abscess Management", "Acute abscess: intralesional triamcinolone acetonide 10 mg/mL (1-3 mL) for rapid inflammation control — superior to incision for non-fluctuant nodules; fluctuant abscess: I&D with culture", "Intralesional corticosteroid achieves rapid pain control and nodule regression in 48-72 hours. Cochrane review supports intralesional steroids for HS nodules. I&D of fluctuant abscesses provides immediate drainage but does not alter disease course — sinus tracts reform.", "Intralesional steroids should be injected into the inflamed nodule (not the skin surface); maximum 3 mL per session; 10 mg/mL concentration preferred for face/groin; perform I&D only for clearly fluctuant abscesses; send culture for recurrent draining wounds.");
        add("medium", "HS Hurley Stage I — Topical Antibiotics", "Topical clindamycin 1% solution BID to active areas — first-line topical treatment for mild HS (Hurley I)", "Topical clindamycin reduces surface bacterial load (particularly Staphylococcus aureus and anaerobes) and inflammatory cytokines at HS lesion sites. RCT evidence confirms non-inferiority to oral tetracycline for mild HS.", "Apply to affected skin fold areas BID; avoid occlusion; resistance develops with prolonged use — limit to 3-month courses; do not use as monotherapy for Hurley II-III.");
        add("low", "HS Hurley Stage I — Lifestyle", "Smoking cessation (reduces flare frequency ~50%), weight reduction (adipokine-driven inflammation), fragrance-free pH-balanced cleanser, loose-fitting clothing over affected areas", "Smoking cessation is the single most impactful lifestyle modification for HS — multiple observational studies show significantly reduced lesion counts in former smokers. Weight loss reduces adipose-driven systemic inflammation. Local skin hygiene reduces secondary bacterial burden.", "Smoking cessation counseling and pharmacotherapy referral; weight management with bariatric surgery referral for BMI > 35 if applicable; these are disease-modifying interventions, not cosmetic recommendations.");
      } else if (isHurley2) {
        add("high", "HS Hurley Stage II — Systemic Antibiotic Therapy", "Oral antibiotics for systemic anti-inflammatory effect: tetracycline combination (doxycycline 100mg BID + rifampin 300mg BID x 12 weeks) or clindamycin 300mg BID + rifampin 300mg BID x 12 weeks — FIRST-LINE systemic therapy for Hurley II", "Doxycycline/rifampin and clindamycin/rifampin combinations are the most evidence-supported systemic antibiotic regimens for HS. Mechanism is primarily anti-inflammatory (IL-1/TNF-alpha modulation) rather than purely antimicrobial. 12-week courses achieve sustained remission in ~60-70% of Hurley II patients.", "Rifampin is NEVER used as monotherapy — must always be combined; monitor LFTs at 4 and 8 weeks; doxycycline: take with full glass of water, avoid lying down 30 min after dose, photosensitivity warning; prescriber decision for all systemic antibiotics.");
        add("high", "HS Hurley Stage II — Biologic Consideration", "Evaluate for adalimumab (Humira) — FDA-approved for moderate-to-severe HS: PIONEER I/II trials demonstrate significant IHS4 response vs placebo. Initiation dose: 160mg SQ, then 80mg at 2 weeks, then 40mg weekly maintenance.", "Adalimumab is the only FDA/EMA-approved biologic for HS. PIONEER trials showed ~58% vs 28% (placebo) HiSCR response at 16 weeks. Anti-TNF-alpha mechanism targets the inflammatory cascade driving HS. Early biologic initiation in Hurley II prevents progression to Hurley III.", "Prescreening required: TB screen (IGRA/PPD), hepatitis B/C, CBC, CMP, ANA; contraindications: active infection, TB, demyelinating disease, CHF; specialist (dermatology/rheumatology) to initiate and monitor; do not use with other biologics simultaneously.");
        add("medium", "HS Hurley Stage II — Surgical Deroofing", "Limited deroofing of individual sinus tracts under local anesthesia (sinusotomy) — reduces recurrence in individual sinus tracts vs I&D alone", "Deroofing (laying open of sinus tracts) has significantly lower recurrence rates (34%) compared to I&D (100%) for individual HS sinus tracts. Procedure: unroof the sinus tract and curettage the epithelial lining under local anesthesia in office. Heals by secondary intention over 3-6 weeks.", "Dermatology or general surgery with HS experience to perform; send tissue for culture; cover with non-adherent moist dressing post-procedure; systemic therapy should be continued concurrently; document tunnel direction for precise unroofing.");
      } else if (isHurley3) {
        add("high", "HS Hurley Stage III — Wide Surgical Excision", "Wide radical excision (skin, subcutaneous tissue, sinus tracts) to uninvolved margins is the only definitive treatment for Hurley III HS — refer to plastic surgery or dermatologic surgery", "Hurley III HS with diffuse interconnected sinus tracts does not respond reliably to medical therapy or limited procedures. Wide radical excision with primary closure or skin grafting achieves 27% recurrence vs >70% for I&D or limited excision. Axillary, inguinal, and perianal regions require tailored excision strategies.", "Preoperative biologic therapy (adalimumab) for 12-16 weeks may reduce inflammation and improve surgical field; reconstruction planning depends on location; post-excision NPWT for open wound management if primary closure not feasible; recurrence monitoring required indefinitely.");
        add("high", "HS Hurley Stage III — Biologic Pre-/Post-Surgery", "Adalimumab (or secukinumab if available) as systemic therapy adjunct to surgery: continues pre-operatively and restarts 4-6 weeks post-operatively after wound closure is confirmed", "Biologic therapy reduces disease burden and inflammatory load surrounding surgical site, improving operative field and reducing immediate post-operative flare. Post-surgical continuation reduces de novo lesion development at non-operated sites.", "Pause biologic 2-4 weeks pre-surgery if immunosuppression is a concern — discuss with surgeon; restart when wound is closed and without active infection; monitor for post-operative infection closely.");
        add("medium", "HS Hurley Stage III — Pain and QoL", "Mandatory structured pain management; mental health referral for depression and QoL impact (Dermatology Life Quality Index score at each visit)", "HS Hurley III causes severe chronic pain, social isolation, and unemployment. Depression prevalence is 3-4x general population. Pain management and mental health support are core components of care — not optional additions.", "DLQI > 10 indicates severe QoL impact — trigger mental health referral; structured pain assessment at every visit; peer support groups and patient advocacy resources should be offered.");
      } else {
        add("high", "HS — Stage Classification Required", "Select Hurley Stage (I, II, or III) in the Stage field to receive stage-specific treatment guidance", "HS management is entirely stage-driven. Hurley I = topical/local; Hurley II = systemic antibiotics/biologic consideration; Hurley III = surgical referral + biologic. Without staging, only generic guidance can be provided.", "Hurley Stage I: single abscess area, no sinus tracts. Hurley II: recurrent abscesses, one or more sinus tracts, normal skin between lesions. Hurley III: diffuse involvement, multiple sinus tracts, minimal normal skin.");
      }

      add("medium", "HS — Local Wound Care (All Stages)", "Non-adherent moisture-retaining dressing for draining sinus tracts; gentle saline or chlorhexidine 0.05% irrigation; change per saturation; avoid adhesives on inflamed skin", "HS draining sinuses require containment of drainage and protection of surrounding fragile inflamed skin. Non-adherent dressings prevent wound bed disruption. Chlorhexidine reduces surface bacterial load without significant cytotoxicity at dilute concentrations.", "Avoid packing sinus tracts with tight gauze — this is painful and counterproductive; non-adherent silicone rope/ribbon contact layer into sinus tracts if needed for drainage management; absorptive foam secondary; document drain characteristics and volume.");
      add("low", "HS — Zinc Gluconate Supplementation", "Zinc gluconate 90mg/day orally for 3-6 months — evidence-supported anti-inflammatory adjunct for HS", "Small RCT (Brocard 2007) and case series show zinc gluconate reduces HS lesion count with anti-inflammatory and anti-androgenic mechanisms. Effect size is modest but additive with other treatments.", "OTC availability; GI side effects (nausea) reduced by taking with food; avoid long-term doses > 40 mg elemental zinc without monitoring; do not use as monotherapy for Hurley II-III.");
      return finalize(out);
    }

    if (c.graftWound) {
      const stageVal = normalizeText(latest.stage || "");
      const isDonor = stageVal.includes("donor");
      const isFailedGraft = stageVal.includes("failure") || stageVal.includes("failed");
      const isIntactGraft = stageVal.includes("intact") && !isFailedGraft;

      if (isDonor) {
        add("high", "STSG Donor Site — Dressing Selection", "Non-adherent dressing options (ranked by evidence): hydrocolloid > calcium alginate > petrolatum-impregnated gauze. Transparent film (Tegaderm/OpSite) for small, superficial donor sites. First choice per institution availability and exudate level.", "Cochrane meta-analysis of donor site dressings: hydrocolloid and calcium alginate achieve faster healing and better pain scores vs petrolatum gauze. Transparent film allows wound monitoring but may not absorb high initial exudate. Both hydrocolloid and alginate allow less-frequent changes (every 3-7 days).", "Avoid plain dry gauze on donor sites — extremely painful, causes mechanical trauma to healing epithelium, and increases healing time. Silver-impregnated non-adherent dressings for donor sites with infection risk (immunocompromised, contaminated fields). Leave first dressing in place until soaking through or Day 3-5 to protect neoepithelialization.");
        add("high", "STSG Donor Site — Pain Management", "Pain management is mandatory for donor sites — they are partial-thickness wounds with intact nerve endings and often more painful than the recipient site: topical EMLA or lidocaine gel 20-30 min pre-change, scheduled acetaminophen/NSAID, PRN opioid for first 48-72 hours", "Donor site pain is a major source of post-operative morbidity and patient satisfaction. Pain correlates with healing delay and dressing choice (dry gauze causes worst pain). Proactive pain management significantly reduces opioid use and improves healing.", "Schedule dressing change analgesics as premedication — not PRN; soak dressing with saline for 5 minutes before removal if adhered; topical bupivacaine 0.25% at closure reduces first 24-hour pain; gabapentin for neuropathic/burning pain if persisting > 5 days.");
        add("medium", "STSG Donor Site — Healing Timeline", "Healing timeline: partial-thickness donor sites typically re-epithelialize in 10-21 days depending on donor thickness. Monitor for: delayed healing > 21 days (suggests wound depth exceeds intended partial thickness), infection (fever, erythema, odor, purulent drainage), and hypertrophic scarring risk", "Split-thickness donor sites heal by re-epithelialization from adnexal structures (hair follicles, sweat glands). Thinner donor sites (0.006-0.012 inch) heal faster with less scarring. Infection is the primary complication delaying healing.", "Change to non-adherent foam at 3-7 days once acute exudate phase passes; begin scar management (silicone gel/sheet) once fully epithelialized; sun protection to epithelialized donor sites for 12 months to prevent dyspigmentation; donor site can be re-harvested after 6-8 weeks.");
        add("low", "STSG Donor Site — Infection Monitoring", "Screen for infection at each dressing change: increased pain, erythema extending > 2 cm from wound edge, temperature > 38.5C, purulent or malodorous drainage — culture and treat with systemic antibiotics if clinically infected", "Donor site infection occurs in approximately 7-8% of cases. Cellulitis around donor site is the most common presentation. Pseudomonas, Staphylococcus, and mixed flora are the typical pathogens. Infection significantly delays healing and increases scar hypertrophy risk.", "Silver non-adherent dressings (Mepilex Ag, Aquacel Ag) at first sign of heavy colonization; systemic antibiotics for clinical infection (not colonization); wound culture before starting antibiotics; never use hydrogen peroxide or betadine on donor sites.");
      } else if (isIntactGraft) {
        add("high", "STSG Recipient — Graft Intact: Immobilization", "Immobilize the grafted area to prevent shear for 5-7 days: bolster dressing or tie-over dressing in areas prone to movement. Absolutely no dependent positioning of grafted extremity for 48-72 hours post-op.", "Graft take depends on plasmatic imbibition (first 24-48 hours) followed by inosculation (capillary connection) at 48-96 hours. Any shear force during these critical phases physically disrupts these connections and causes graft failure. Immobilization is the single most important early post-operative action.", "Bolster (tie-over) dressing: apply foam or cotton bolster and secure with sutures through wound edge to maintain even pressure and prevent seroma/hematoma formation; avoid bulky overlying dressings that shift on movement; place extremity in elevated position.");
        add("high", "STSG Recipient — Graft Take Assessment", "Assess graft take at first dressing change (Day 3-5 per surgeon protocol): healthy graft — pink/red, non-blanchable, adherent to wound bed. Signs of failure: white/gray color, mobility over wound bed, seroma or hematoma underneath, necrosis.", "Graft take is the primary outcome measure of STSG procedures. Early identification of failure areas allows salvage procedures. Pink/red firmly adherent graft = successful inosculation. Grey/white mobile graft = failure. Sub-graft collections (hematoma/seroma) must be evacuated immediately to re-attempt take.", "Never forcibly remove the first dressing — soak with saline for 10 minutes; note percentage of graft take; partial failures can be re-grafted or managed with skin substitutes; report to surgeon same day if < 70% take or if hematoma/seroma present.");
        add("medium", "STSG Recipient — Intact Graft Maintenance", "Post-take maintenance (after Day 5): non-adherent moisture-retaining dressing; gentle cleansing; moisturizer to grafted skin after epithelialization; compression garment over 2-4 weeks for high-movement areas", "After successful graft take, the primary goals are moisture maintenance, scar management, and protection from trauma. Early scar management with compression and silicone significantly reduces hypertrophic scarring. Grafted skin has no sebaceous glands and requires external moisturization.", "Begin silicone gel or silicone sheet over healed graft at 3-4 weeks; compression garment (20-30 mmHg) for grafts on extremities; strict sun protection for 12 months (grafted skin is highly susceptible to UV hyperpigmentation); avoid shear and friction for 3-4 weeks post-procedure.");
      } else if (isFailedGraft) {
        add("high", "STSG — Failed Graft: Assessment", "Failed graft: urgently assess failure extent (partial vs. total), underlying cause, and wound bed condition. Common causes: hematoma/seroma (evacuate immediately), infection (culture + systemic antibiotics), shear/movement, poor recipient bed vascularity, poor patient nutrition/immune status.", "Failed graft management begins with identifying the cause. Hematoma and seroma are the most preventable causes and can be addressed with evacuation + re-approximation. Infection requires treatment before re-grafting. Poor wound bed vascularity may require vascular consultation.", "Notify surgeon on same day of identified graft failure; do not attempt to re-graft until underlying cause is treated and wound bed is clean and granulating; photograph extent of failure for operative planning; assess nutritional status — albumin < 3.0 g/dL significantly impairs graft take.");
        add("high", "STSG — Failed Graft: Wound Bed Preparation", "Failed graft wound management: gentle sharp debridement of non-viable graft tissue, normal saline irrigation, non-adherent moisture-retaining primary dressing, NPWT consideration for large failed graft beds to stimulate granulation for re-grafting", "Once failed graft is removed, the wound bed must be prepared to granulating tissue before re-grafting. NPWT accelerates granulation formation and reduces wound contraction (which would worsen the size of area requiring re-grafting). Mean time to re-grafting readiness: 2-3 weeks with NPWT vs 4-6 weeks without.", "NPWT contraindicated over exposed bowel, vessels, or non-vascularized bone; confirm wound bed is free of infection before NPWT; apply with interface layer (non-adherent contact layer) to protect fragile granulation tissue; change every 48-72 hours.");
        add("medium", "STSG — Failed Graft: Skin Substitutes", "Temporary skin substitute (Integra Bilayer, Biobrane, Mepilex) or allograft as interim coverage while wound bed matures for re-grafting", "Temporary skin substitutes maintain wound moisture, reduce pain, and prevent bacterial invasion while wound bed preparation proceeds. Integra Bilayer on a well-vascularized wound bed creates a neodermis for subsequent thin STSG (improves cosmetic and functional outcome vs. STSG alone).", "Integra Bilayer requires 2-3 weeks for neodermis formation before thin STSG over it; keep Integra moist and free from infection; allograft is an alternative for large temporary coverage; specialist (plastic surgery) to direct skin substitute selection.");
        add("medium", "STSG — Failed Graft: Nutritional Optimization", "Pre-re-grafting nutrition: protein >= 1.5 g/kg/day, vitamin C 500mg BID, zinc 220mg QD (if deficient); albumin > 3.0 g/dL before re-grafting; dietitian referral if malnourished", "Albumin < 3.0 g/dL is an independent risk factor for graft failure. Malnutrition impairs collagen synthesis, immune function, and angiogenesis — all critical for graft take. Targeted nutritional optimization before re-grafting significantly improves outcomes.", "Check albumin, prealbumin, and zinc before re-grafting; ensure HbA1c < 8% in diabetic patients before re-grafting; delay re-grafting until nutritional parameters are optimized where feasible.");
      } else {
        add("high", "Graft Wound — Select Site/Status", "Select graft site and status (Donor Site, Recipient-Intact, Recipient-Partial Failure, or Recipient-Full Failure) in the Stage field to receive specific guidance", "Management differs completely between donor site care, post-take graft maintenance, and failed graft wound bed preparation. Selection enables the appropriate pathway.", "Donor sites re-epithelialize from adnexal structures; recipient sites depend on graft take assessment at Day 3-5; failed grafts require wound bed preparation before re-grafting.");
        add("medium", "Graft Wound — Universal Care Principles", "All graft wounds: prevent shear and trauma; non-adherent primary dressings; strict infection surveillance; nutrition optimization; pain management", "Universal principles apply regardless of graft site or take status. Shear disrupts graft take and delays donor healing. Infection is the primary complication at both sites. Nutrition drives healing capacity.", "Assess protein intake, albumin, and HbA1c in all graft patients; reinforce movement restrictions; patient education on warning signs of infection and graft failure.");
      }
      return finalize(out);
    }

    // ── End special pathway intercepts ────────────────────────────────────

    if (!c.tissueBreakdownDocumented) {
      add(
        "low",
        "Assessment Completeness",
        "Tissue-bed detail not charted in export; using wound type + measurement defaults.",
        "Slough/eschar/epithelialization/granulation fields were blank, so defaults are driven by type, area, depth, and pathway signals.",
        "Update tissue-bed fields when available to tighten treatment specificity."
      );
    }

    if (c.potentialBioburden || c.worsening) {
      add("medium", "Antimicrobial Cleanse", "Dakin solution (dilute, short-duration, protocol-driven)", "Bioburden/worsening signals support a short, protocolized antiseptic-cleanse phase before de-escalation.", "Verify dilution and duration; transition back to saline once local infection signals settle.");
    }
    add("medium", "Cleansing", "Normal saline irrigation", "Baseline cleanser compatible with most wound products and with collagenase workflows after antiseptic rinse-out.", "");

    if (c.exudateProxy || c.potentialBioburden) {
      add("medium", "Periwound", "Skin barrier film / barrier ointment", "Periwound protection is helpful with drainage, frequent changes, or antimicrobial use.", "Reapply per product wear-time and reassess for maceration.");
    }

    if (c.pressureRelated) {
      add("medium", "Pressure Management", "Repositioning and support-surface reinforcement", `Pressure-related wound noted at ${latest.location || "reported site"}.`, "Keep off-loading plan active as core therapy.");
    }

    if (c.diabeticFootRelated) {
      add("high", "Diabetic Foot Offloading", "Total contact cast (TCC) — GOLD STANDARD for neuropathic plantar DFU; non-removable walker as minimum", "IWGDF 2023 Grade A: TCC provides highest offloading efficacy in RCTs and ensures 24-hour compliance. Non-removable feature is the mechanism of benefit over removable walkers.", "Use TCC when no active infection, gangrene, or fall risk contraindication; non-removable irremovable walker is an acceptable alternative if casting not feasible; removable walker only if non-removable options are contraindicated.");
      add("medium", "Diabetic Foot Offloading", "Removable knee-high walker", "Alternative offloading pathway when non-removable options are not feasible.", "Adherence/wear-time drives effectiveness; educate patient on 24-hour use.");
      add("low", "Diabetic Foot Offloading", "Removable ankle-high offloading device / post-op shoe", "Fallback offloading option if higher-level devices are not available.", "Monitor closely for insufficient offloading response.");
    }

    if (c.diabeticSuboptimal4WeekProgress) {
      add("high", "Diabetic Foot Reassessment", "Reassess vascular status and consult vascular specialist", "Suboptimal 4-week diabetic ulcer response signal (target is usually >50% area reduction in ~4 weeks).", "Verify infection control, glycemic control, wound care quality, and offloading adherence in parallel.");
    }

    if (c.arterialRelated) {
      add("high", "Arterial / Ischemic Management", "Vascular evaluation and revascularization referral", "Arterial/ischemic pattern may limit healing unless perfusion is addressed.", "Use caution with aggressive debridement/compression until perfusion status is defined.");
    }

    const debridementGate = evaluateDebridementSafetyGate(c);
    if (c.debridementNeeded || c.slough >= 10 || c.worsening) {
      if (debridementGate.allowDebridement) {
        const plan = selectDebridementPlan(c);
        plan.forEach((item) => add(item.priority, item.category, item.option, item.rationale, item.cautions));
      } else {
        const holdText = debridementGate.holdReasons.join("; ");
        add(
          "high",
          "Debridement Gate",
          `Hold debridement technique selection pending: ${holdText}.`,
          "Safety gate detected higher-risk conditions that should be clarified before selecting a debridement method.",
          "Reassess perfusion, infection severity, and heel-eschar exception criteria before choosing a debridement technique.",
        );
      }
    }

    if (c.heelStableEscharException) {
      add("medium", "Heel Exception", "Evaluate for stable dry heel eschar pathway before debridement", "Heel eschar may require a conservative pathway when dry/stable and without infection/ischemia signs.", "Confirm perfusion and infection assessment before debridement decisions.");
    }

    if (c.potentialBioburden) {
      add("medium", "Antimicrobial Dressing", "Hydrofera Blue antibacterial foam", "Antibacterial foam option with absorptive properties for local wound management.", "Pair with appropriate secondary dressing and moisture balance checks.");
      add("medium", "Antimicrobial Dressing", "Silver-containing dressing (e.g., silver Hydrofiber/foam/alginate)", "Consider in wounds with infection risk or elevated bioburden signals.", "Reassess ongoing need frequently; if also using Santyl, manage sequencing/compatibility per protocol.");
    } else {
      add("low", "Infection Stewardship", "Avoid routine antimicrobial escalation in clinically uninfected wounds", "When no infection/bioburden signal is present, focus on moisture balance, debridement cadence, and offloading/compression fundamentals.", "If diabetic foot infection signs emerge, reassess promptly and treat per infection protocol.");
    }

    if (c.exudateProxy) {
      add("medium", "Exudate Management", "Calcium alginate (or silver alginate when bioburden concern exists)", "Absorptive dressing option for moderate-to-high drainage profile.", "Requires secondary cover dressing and regular saturation checks.");
      add("medium", "Wound Dressing", "Foam dressing (standard or silicone border)", "Foam can improve fluid handling and cushioning over moderate drainage wounds.", "Change when saturation approaches strike-through.");
      add("medium", "Secondary Dressing", "Superabsorbent polymer dressing", "High-drainage wounds may need additional absorbent secondary coverage.", "Use with routine periwound checks for maceration.");
    } else if (!c.potentialBioburden && c.slough <= THRESHOLDS.clean_bed_slough_max_pct) {
      add("low", "Wound Dressing", "Hydrogel or moisture-balancing non-antimicrobial dressing", "Lower-drainage beds generally benefit from moisture donation/retention rather than high-absorbency antimicrobials.", "Avoid over-hydration and re-check for maceration.");
    }

    if (c.cleanBed && c.granulating && c.stalled && !c.potentialBioburden) {
      add("medium", "Matrix Support", "Collagen dressing / ECM support", "Granulating but stalled trajectory with low necrotic burden may benefit from collagen matrix support.", "Re-evaluate progress and continue pressure, nutrition, and perfusion optimization.");
    }

    if (c.cavityLikely) {
      add("medium", "Wound Packing", "Gauze packing / ribbon", "Depth profile suggests cavity-style fill may be needed to support uniform healing.", "Avoid overpacking and document packing length/material at each change.");
    }

    if (c.venousRelated && !c.arterialRelated) {
      if (c.abiInadequateForCompression) {
        add("high", "⚠ ABI Compression Contraindication", `ABI documented as ${c.abiRange} — AVOID full compression. Refer to vascular specialist before any compression.`, "Applying standard compression to limbs with moderate/severe arterial insufficiency causes critical ischemia, limb-threatening complications, and potential amputation.", "Vascular referral required; reduced compression (18-25 mmHg) may be used under specialist supervision with ABI 0.6-0.8; no compression if ABI < 0.6 or non-compressible.");
      } else if (!c.abiDocumented) {
        add("high", "⚠ ABI Required Before Compression", "Document ABI or clinical pulse/Doppler assessment BEFORE applying compression therapy", "Compression applied to an ischemic limb causes critical limb ischemia. ABPI must be documented prior to compression initiation per NICE, WUWHS, and SVS guidelines.", "Obtain ABI (or toe pressure if calcified vessels); use clinical pulse assessment and capillary refill as minimum if Doppler unavailable; document in chart before ordering compression.");
      } else {
        add("high", "Compression", "Multilayer compression bandaging (ABI documented — appropriate for compression)", "Venous-pattern wounds require edema control with compression. ABI has been documented.", "Maintain compression and reassess ABI periodically; reassess if pain, color change, or new ischemic signs appear.");
      }
      if (c.potentialBioburden) {
        add("medium", "Infected VLU Antiseptic", "Cadexomer iodine dressing (Iodosorb) — Cochrane-supported for infected VLUs", "Cadexomer iodine releases iodine slowly as exudate is absorbed, providing sustained antimicrobial activity and concurrent debridement. Cochrane review demonstrates efficacy over standard care for infected VLUs.", "Screen for iodine sensitivity and thyroid disease; contraindicated in pregnancy; limit duration to 3 months max; not for dry wounds.");
      }
      if (c.venousSuboptimal4WeekProgress) {
        add("high", "Venous Non-healing Reassessment", "Re-check compression execution/adherence and consider vascular duplex referral", "Suboptimal venous healing signal after a multi-week interval suggests need to verify compression quality and venous pathway optimization.", "Escalate to vascular/wound specialist workflow when standard compression is not producing expected trajectory.");
        add("medium", "Pentoxifylline Consideration", "Consider oral pentoxifylline 400mg TID as adjunct to compression (Cochrane Grade A)", "Cochrane meta-analysis (Jull et al. 2012) demonstrates pentoxifylline plus compression is more effective than compression alone (NNT~6). Improves microcirculatory flow.", "Prescriber decision; GI side effects common; contraindicated with recent MI/cerebral hemorrhage; monitor renal function.");
      }
    }

    if (c.pressureReliefNeeded) {
      add("medium", "Pressure Relief", "Heel offloading boots / heel suspension", "Pressure unloading is a core intervention for heel and pressure-risk sites.", "Check for device-related pressure points at each dressing interval.");
      add("medium", "Pressure Relief", "Support surfaces (high-spec foam / alternating pressure mattress)", "Support surface optimization can reduce recurrent pressure injury risk.", "Adjunct to repositioning, not a replacement.");
    }

    if (c.worsening) {
      add("high", "Worsening Trend", "Intensify local wound treatment sequence and bioburden control plan", c.worseningReasons.length ? c.worseningReasons.join("; ") : "Wound trend worsening.", "Increase treatment intensity and verify infection workup steps per protocol.");
    }

    if (c.chronic) {
      add("medium", "Chronic Pathway", "Chronic wound protocol review", `Approximate wound age ${c.woundAgeDays} days.`, "Reassess nutrition, perfusion, pressure relief, bioburden, and objective healing trajectory benchmarks.");
      add("medium", "Biofilm Disruption", "Wound bed scrubbing with PHMB/betaine cleanser (e.g., Prontosan) at each change — biofilm management for stalled wounds", "Chronic stalled wounds have >60% biofilm prevalence. Mechanical scrubbing combined with PHMB/betaine cleanser disrupts biofilm EPS matrix — foundational per TIMERS biofilm framework.", "Combine mechanical disruption with appropriate antimicrobial cleanser post-scrubbing; this is a supplement to, not replacement for, formal debridement when necrotic tissue is present.");
    }

    if (c.stalled && !c.chronic) {
      add("low", "Stalled Wound", "Consider biofilm disruption protocol: wound bed scrubbing followed by PHMB/betaine cleanser rinse", "Wounds showing limited progress despite adequate care may have biofilm. Early biofilm disruption can re-establish healing trajectory.", "Reassess wound bed after 2-4 weeks of biofilm-focused protocol.");
    }

    if (c.hypergranulationPresent) {
      add("medium", "Hypergranulation", "Silver nitrate chemical cauterization and/or foam compression dressing to reduce proud flesh", "Hypergranulation above wound edges blocks epithelial migration. Chemical cauterization with silver nitrate sticks or firm foam dressing pressure reduces hypergranulation tissue.", "Apply silver nitrate precisely to granulation tissue only — protect periwound skin with petroleum jelly; short-course topical steroid under dressing is an alternative; correct underlying cause (infection, occlusion, irritation).");
    }

    if (c.osteomyelitisSignal) {
      add("high", "Osteomyelitis Workup", "Obtain bone imaging (plain X-ray first; MRI if X-ray negative/inconclusive) and surgical consultation. Bone biopsy is gold standard for diagnosis and culture-directed therapy.", "Osteomyelitis requires 6+ weeks of culture-guided antibiotic therapy and often surgical debridement/resection. Clinical diagnosis alone has poor sensitivity; imaging and bone biopsy are needed to guide management.", "Probe-to-bone test (positive probe = osteomyelitis with ~89% PPV in DFU); monitor ESR/CRP; infectious disease consultation for antibiotic selection and duration.");
      add("high", "Osteomyelitis — Infection Management", "Culture-guided IV/oral antibiotic therapy × 6 weeks minimum (infectious disease consultation required)", "IDSA 2023: surgical removal of infected bone + 2-5 day post-surgical antibiotic course is preferred over long-course medical management alone when resection is feasible. Culture-guided de-escalation essential.", "Do not start antibiotics before bone biopsy if biopsy is planned — antibiotics reduce culture yield; cover MRSA empirically if gram-positive infection suspected.");
    }

    if (c.epiboleSignal) {
      add("medium", "Wound Edge — Epibole / Callus", "Assess and treat rolled/hyperkeratotic wound edges: sharp or curette debridement of callus/epibole; silver nitrate to edges; consider monofilament fiber debridement", "Rolled (epibolic) wound edges and perilesional callus block epithelial migration across the wound surface and are a major cause of stalled healing despite a healthy wound bed. Mechanical removal re-establishes the proliferative margin.", "After edge debridement, apply wound moisture-balance dressing; reassess for advancement at each change; consider advanced wound therapy (collagen, skin substitute) if edges remain non-advancing after 4 weeks of active management.");
    }

    if (c.periWoundMacerated) {
      add("medium", "Periwound Maceration", "Reduce dressing occlusion and/or exudate burden; apply zinc oxide or cyanoacrylate skin barrier to periwound skin", "Periwound maceration softens and weakens skin integrity, can progress to MASD, and increases infection risk. Addressing the source of excess moisture (dressing selection, exudate management) combined with a barrier product protects the wound margin.", "Consider more absorptive dressing or shorter change interval; avoid occlusive film dressings in high-drainage wounds; reassess at each change.");
    }

    const stageText4 = normalizeText(latest.stage || "");
    const isStage34PI = c.pressureRelated && (stageText4.includes("stage 3") || stageText4.includes("stage 4") || stageText4.includes("stage iii") || stageText4.includes("stage iv") || stageText4.includes("unstageable"));
    if (isStage34PI || (c.chronic && c.pressureRelated)) {
      add("medium", "Nutrition — Stage 3/4 PI", "Arginine-enriched oral supplement (e.g., ArginAid) — consider when wound healing is the goal", "RCTs demonstrate arginine-enriched supplements improve Stage 3/4 PI healing rates. NPUAP/EPUAP/PPPIA 2019 recommends consideration for complex pressure injuries.", "Use alongside overall nutrition optimization, not as a substitute; dietitian involvement recommended; renal function monitoring if impaired.");
    }

    if (Array.isArray(c.effectiveInfectionSigns) && c.effectiveInfectionSigns.length) {
      const labels = labelsForOverrideValues(c.effectiveInfectionSigns);
      add("high", "Infection Workup", `Infection signs present (${labels.join(", ")}): obtain wound culture using Levine technique before escalating antibiotic therapy`, "The Levine technique (10-second rotating swab with moderate pressure over 1cm2 of cleansed wound) is the preferred culture method per Gardner et al. Surface swab alone reflects colonization — correlate culture with clinical signs.", "Treat only clinically infected wounds; de-escalate antibiotics based on culture and clinical response; deep tissue culture or biopsy is gold standard for osteomyelitis workup.");
    }

    if ((c.debridementNeeded || c.slough >= 30) && (c.venousRelated || c.pressureRelated || c.diabeticFootRelated)) {
      add("low", "Debridement Pain Management", "Consider EMLA cream 60-90 min before sharp debridement — RCT evidence for pain reduction in leg ulcers", "RCT evidence demonstrates significant pain reduction during sharp debridement of venous leg ulcers with EMLA applied 60-90 minutes before procedure under occlusion.", "Do not apply to infected/denuded periwound skin; methemoglobinemia risk with large quantities or G6PD deficiency; prescriber decision.");
    }

    if (c.exudateProxy || c.potentialBioburden || c.debridementNeeded) {
      add("medium", "Change Frequency", "Daily and PRN for saturation/soiling", "Higher drainage/bioburden/necrotic burden usually needs closer dressing interval.", "Shorten interval sooner if strike-through or periwound maceration develops.");
    } else if (c.cleanBed && c.granulating) {
      add("low", "Change Frequency", "Every 48-72 hours and PRN soiling", "Stable granulating wounds often tolerate a longer interval.", "Continue weekly measurements and tighten interval if trend worsens.");
    }

    add("low", "Systemic", "Screen for micronutrient deficiency (Zinc, Vitamin C, Vitamin D) if wound is non-healing or chronic", "Zinc and Vitamin C are essential cofactors in wound healing; deficiency is prevalent in chronic wound patients and impairs closure. Vitamin D deficiency is common and linked to impaired healing.", "Check serum levels where feasible; correct confirmed deficiencies; routine supplementation without deficiency evidence is not strongly supported.");

    if (!out.length) {
      add("low", "General", "Continue current local wound care protocol", "No strong trigger detected from available export fields.", "Use full bedside assessment to refine product choice.");
    }

    return finalize(out);
  }

  function buildRecommendations(latest, previous, manualOverrides = null) {
    const c = buildContext(latest, previous, manualOverrides);
    const out = [];
    const add = (priority, category, consideration, rationale) => out.push({ priority, category, consideration, rationale });

    if (c.isResolved || c.looksClosed) {
      add("low", "Closure", "Likely closed/resolved; maintain prevention and monitor for recurrence.", "Current status/measurements suggest closure.");
      if (!c.isResolved && c.looksClosed) {
        add("medium", "Documentation Check", "Size is charted 0x0x0 while status is not resolved; verify chart consistency.", "Potential documentation mismatch can hide true wound trajectory.");
      }
      return sortByPriority(out);
    }

    if (c.pressureRelated) {
      add("medium", "Pressure Redistribution", "Reinforce off-loading/repositioning and support-surface plan.", `Active pressure-related wound at ${latest.location || "reported site"}.`);
    }

    if (c.debridementNeeded || c.slough >= 10 || c.worsening) {
      const debridementGate = evaluateDebridementSafetyGate(c);
      if (debridementGate.allowDebridement) {
        const debridementPlan = selectDebridementPlan(c);
        if (debridementPlan.length) {
          const top = debridementPlan[0];
          add(top.priority, "Debridement Strategy", `Primary option: ${top.option}.`, top.rationale);
        }
      } else {
        add("high", "Debridement Gate", `Hold debridement technique selection until: ${debridementGate.holdReasons.join("; ")}.`, "Safety checks should be completed before selecting a debridement method.");
      }
    }

    if (c.heelStableEscharException) {
      add("medium", "Heel Eschar Exception", "If heel eschar is dry/stable and no infection/ischemia is present, verify whether non-debridement is preferred.", "Heel wounds may have special protocol exceptions.");
    }

    if (c.diabeticSuboptimal4WeekProgress) {
      add("high", "Diabetic Foot Non-healing", "If <50% area reduction over about 4 weeks, reassess vascular status and consider vascular consult.", `Recent interval ~${c.previousIntervalDays} days with area change ${c.areaChangePct?.toFixed?.(1) ?? "unknown"}%.`);
    }

    if (c.venousSuboptimal4WeekProgress) {
      add("high", "Venous Non-healing", "If no meaningful improvement after 4-6 weeks, verify compression quality/adherence and escalate venous pathway evaluation.", `Recent interval ~${c.previousIntervalDays} days with area change ${c.areaChangePct?.toFixed?.(1) ?? "unknown"}%.`);
    }

    if (c.worsening) {
      add("high", "Worsening Trend", "Wound trend is worsening; intensify local wound treatment sequence and objective weekly monitoring.", c.worseningReasons.join("; "));
      if (c.slough >= 50) {
        add("high", "Infection/Bioburden Check", "Consider infection/bioburden assessment per protocol.", `Worsening trend with slough burden ~${c.slough.toFixed(0)}%.`);
      }
    }

    if (c.diabeticFootRelated && !c.potentialBioburden) {
      add("low", "Infection Stewardship", "Avoid routine antibiotic escalation for clinically uninfected diabetic foot ulcers.", "Infection therapy should be driven by clinical infection signs, not colonization alone.");
    }

    if (c.cleanBed && c.granulating && c.stalled) {
      add("medium", "Collagen/ECM", "Consider collagen/ECM dressing to support granulation in a stalled wound bed.", `Granulation ~${c.gran.toFixed(0)}%, low necrotic burden, limited recent size reduction.`);
    }

    if (c.chronic) {
      add("medium", "Chronic Wound Review", "Consider chronic-wound pathway review (nutrition, perfusion, pressure, infection, moisture balance).", `Approximate wound age: ${c.woundAgeDays} days.`);
    }

    if (!out.length) {
      add("low", "Continue Current Plan", "No strong trigger detected from available fields; continue current protocol and reassess.", "No debridement/collagen/worsening-trend threshold crossed in this export.");
    }

    return sortByPriority(out);
  }

  function classifyTreatmentEffect(currentRow, priorRow) {
    const toFloat = (v) => {
      if (v == null || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const currentArea = toFloat(currentRow.area_cm2);
    const priorArea = toFloat(priorRow.area_cm2);
    const currentDepth = toFloat(currentRow.depth_cm);
    const priorDepth = toFloat(priorRow.depth_cm);
    const currentSlough = toFloat(currentRow.slough_pct_mid);
    const priorSlough = toFloat(priorRow.slough_pct_mid);
    const currentGran = toFloat(currentRow.granulation_pct_mid);
    const priorGran = toFloat(priorRow.granulation_pct_mid);

    const currentStatus = normalizeText(currentRow.status);
    const priorStatus = normalizeText(priorRow.status);

    let improved = 0;
    let worse = 0;
    const why = [];

    if (currentStatus === "resolved" && priorStatus !== "resolved") {
      improved += 3;
      why.push("status changed to resolved");
    }

    if (currentArea != null && priorArea != null && priorArea > 0) {
      const pct = ((currentArea - priorArea) / priorArea) * 100;
      if (pct <= -15) {
        improved += 2;
        why.push(`area improved ${Math.abs(pct).toFixed(1)}%`);
      } else if (pct >= 15) {
        worse += 2;
        why.push(`area worsened ${pct.toFixed(1)}%`);
      }
    }

    if (currentDepth != null && priorDepth != null) {
      const d = currentDepth - priorDepth;
      if (d <= -0.1) {
        improved += 1;
        why.push(`depth improved ${Math.abs(d).toFixed(2)} cm`);
      } else if (d >= 0.1) {
        worse += 1;
        why.push(`depth worsened ${d.toFixed(2)} cm`);
      }
    }

    if (currentSlough != null && priorSlough != null) {
      const d = currentSlough - priorSlough;
      if (d <= -20) {
        improved += 1;
        why.push(`slough decreased ${Math.abs(d).toFixed(1)} pts`);
      } else if (d >= 20) {
        worse += 1;
        why.push(`slough increased ${d.toFixed(1)} pts`);
      }
    }

    if (currentGran != null && priorGran != null) {
      const d = currentGran - priorGran;
      if (d >= 20) {
        improved += 1;
        why.push(`granulation increased ${d.toFixed(1)} pts`);
      } else if (d <= -20) {
        worse += 1;
        why.push(`granulation decreased ${Math.abs(d).toFixed(1)} pts`);
      }
    }

    if (improved === 0 && worse === 0) return ["Indeterminate", "No major directional change detected from available fields."];
    if (improved >= worse + 1) return ["Likely improving", why.join("; ")];
    if (worse >= improved + 1) return ["Likely worsening", why.join("; ")];
    return ["Mixed response", why.join("; ")];
  }

  function uniqueNonEmpty(items) {
    const seen = new Set();
    const out = [];
    for (const item of items || []) {
      const text = String(item || "").trim();
      if (!text) continue;
      const key = normalizeText(text);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(text);
    }
    return out;
  }

  function pushUniqueStep(stepMap, key, value) {
    const text = String(value || "").trim();
    if (!text) return;
    if (!stepMap[key]) stepMap[key] = [];
    const normalized = normalizeText(text);
    if (stepMap[key].some((x) => normalizeText(x) === normalized)) return;
    stepMap[key].push(text);
  }

  function classifyStructuredSteps(treatment) {
    const category = normalizeText(treatment?.category || "");
    const option = normalizeText(treatment?.option || "");
    const out = [];

    if (
      category.includes("debridement") ||
      category.includes("enzymatic") ||
      category.includes("autolytic") ||
      option.includes("debridement") ||
      option.includes("santyl") ||
      option.includes("collagenase")
    ) out.push("debridement_consideration");

    if (
      category.includes("cleansing") ||
      category.includes("antimicrobial cleanse") ||
      option.includes("irrigation") ||
      option.includes("saline") ||
      option.includes("dakin") ||
      option.includes("hypochlorous") ||
      option.includes("acetic acid")
    ) out.push("cleanser");

    if (
      category.includes("periwound") ||
      option.includes("skin barrier") ||
      option.includes("periwound") ||
      option.includes("silicone contact layer") ||
      option.includes("adhesive-injury")
    ) out.push("peri_wound");

    if (
      category.includes("antimicrobial dressing") ||
      category.includes("matrix support") ||
      option.includes("medihoney") ||
      option.includes("collagen dressing") ||
      option.includes("hydrofera") ||
      option.includes("silver")
    ) out.push("topical_treatment");

    if (
      category.includes("wound packing") ||
      option.includes("packing") ||
      option.includes("ribbon") ||
      option.includes("cavity")
    ) out.push("wound_packing");

    if (
      category.includes("wound dressing") ||
      category.includes("exudate management") ||
      category.includes("moisture balance") ||
      option.includes("foam dressing") ||
      option.includes("hydrocolloid") ||
      option.includes("hydrogel") ||
      option.includes("calcium alginate") ||
      option.includes("hydrofiber")
    ) out.push("wound_dressing");

    if (
      category.includes("secondary dressing") ||
      option.includes("secondary") ||
      option.includes("superabsorbent") ||
      option.includes("cover dressing")
    ) out.push("secondary_dressing");

    if (
      category.includes("change frequency") ||
      option.includes("daily and prn") ||
      option.includes("every 48-72")
    ) out.push("change_frequency");

    if (
      category.includes("compression") ||
      category.includes("venous ulcer") ||
      option.includes("compression")
    ) out.push("compression");

    if (
      category.includes("pressure management") ||
      category.includes("pressure relief") ||
      category.includes("diabetic foot offloading") ||
      option.includes("offloading") ||
      option.includes("repositioning") ||
      option.includes("heel suspension") ||
      option.includes("support surfaces")
    ) out.push("pressure_relief");

    return Array.from(new Set(out));
  }

  function filterStepValuesByKeyword(values, keywords) {
    if (!Array.isArray(values) || !values.length) return [];
    if (!Array.isArray(keywords) || !keywords.length) return uniqueNonEmpty(values);
    return uniqueNonEmpty(values.filter((value) => {
      const text = normalizeText(value);
      return keywords.some((keyword) => text.includes(keyword));
    }));
  }

  function prioritizeStepValues(values, preferredKeywords = [], maxCount = 2) {
    const list = uniqueNonEmpty(values);
    if (!list.length) return [];
    const normalizedKeywords = (preferredKeywords || []).map((x) => normalizeText(x)).filter(Boolean);

    const scored = list.map((value, idx) => {
      const text = normalizeText(value);
      let score = 0;
      normalizedKeywords.forEach((kw, kwIdx) => {
        if (!kw) return;
        if (text.includes(kw)) score += (normalizedKeywords.length - kwIdx + 1);
      });
      return { value, idx, score };
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.idx - b.idx;
    });

    return scored.slice(0, Math.max(1, maxCount)).map((x) => x.value);
  }

  function applyPathwayTemplate(stepMap, context) {
    const templated = {
      debridement_consideration: uniqueNonEmpty(stepMap.debridement_consideration),
      cleanser: uniqueNonEmpty(stepMap.cleanser),
      peri_wound: uniqueNonEmpty(stepMap.peri_wound),
      topical_treatment: uniqueNonEmpty(stepMap.topical_treatment),
      wound_packing: uniqueNonEmpty(stepMap.wound_packing),
      wound_dressing: uniqueNonEmpty(stepMap.wound_dressing),
      secondary_dressing: uniqueNonEmpty(stepMap.secondary_dressing),
      change_frequency: uniqueNonEmpty(stepMap.change_frequency),
      compression: uniqueNonEmpty(stepMap.compression),
      pressure_relief: uniqueNonEmpty(stepMap.pressure_relief),
    };

    const pressureReliefCore = filterStepValuesByKeyword(templated.pressure_relief, ["reposition", "support surface", "heel", "offloading"]);
    const pressureReliefDiabetic = filterStepValuesByKeyword(templated.pressure_relief, ["offloading", "walker", "tcc", "post-op"]);
    const pressureReliefArterial = filterStepValuesByKeyword(templated.pressure_relief, ["reposition", "support surface", "heel"]);

    if (context.woundPathway === "pressure") {
      templated.compression = [];
      templated.pressure_relief = pressureReliefCore;
    } else if (context.woundPathway === "venous") {
      templated.pressure_relief = [];
    } else if (context.woundPathway === "diabetic_foot") {
      templated.compression = [];
      templated.pressure_relief = pressureReliefDiabetic;
    } else if (context.woundPathway === "arterial") {
      templated.compression = [];
      templated.pressure_relief = pressureReliefArterial;
    } else if (context.woundPathway === "mixed_leg") {
      templated.compression = [];
      templated.pressure_relief = pressureReliefArterial;
    }

    if (!context.cavityLikely) templated.wound_packing = [];

    return templated;
  }

  function buildStepwiseConsiderations(latest, previous, treatments, manualOverrides = null) {
    const context = buildContext(latest, previous, manualOverrides);
    const debridementGate = evaluateDebridementSafetyGate(context);
    const debridementPlan = debridementGate.allowDebridement ? selectDebridementPlan(context) : [];
    const stepMap = {
      debridement_consideration: [],
      cleanser: [],
      peri_wound: [],
      topical_treatment: [],
      wound_packing: [],
      wound_dressing: [],
      secondary_dressing: [],
      change_frequency: [],
      compression: [],
      pressure_relief: [],
    };

    for (const t of treatments || []) {
      const keys = classifyStructuredSteps(t);
      for (const key of keys) pushUniqueStep(stepMap, key, t.option);
    }

    const safetyChecks = buildSafetyChecks(context, treatments);
    const templatedSteps = applyPathwayTemplate(stepMap, context);
    const prioritizedDebridement = prioritizeStepValues(templatedSteps.debridement_consideration, ["sharp", "santyl", "xsonx", "arobella", "medihoney"], 4);
    const prioritizedCleanser = context.potentialBioburden
      ? prioritizeStepValues(templatedSteps.cleanser, ["dakin", "normal saline"], 2)
      : prioritizeStepValues(templatedSteps.cleanser, ["normal saline", "sterile water", "hypochlorous"], 1);
    const prioritizedPeriWound = prioritizeStepValues(templatedSteps.peri_wound, ["skin barrier", "silicone"], 1);
    const prioritizedTopical = context.potentialBioburden
      ? prioritizeStepValues(templatedSteps.topical_treatment, ["hydrofera", "silver", "medihoney", "collagen"], 2)
      : prioritizeStepValues(templatedSteps.topical_treatment, ["collagen", "medihoney", "hydrofera", "silver"], 2);
    const prioritizedPacking = prioritizeStepValues(templatedSteps.wound_packing, ["packing", "ribbon", "gauze"], 1);
    const prioritizedDressing = context.exudateProxy
      ? prioritizeStepValues(templatedSteps.wound_dressing, ["calcium alginate", "foam", "hydrofiber", "hydrocolloid", "hydrogel"], 2)
      : prioritizeStepValues(templatedSteps.wound_dressing, ["hydrogel", "hydrocolloid", "foam"], 2);
    const prioritizedSecondary = prioritizeStepValues(templatedSteps.secondary_dressing, ["superabsorbent", "secondary"], 1);
    const prioritizedFrequency = prioritizeStepValues(templatedSteps.change_frequency, ["daily", "48-72"], 1);
    const prioritizedCompression = prioritizeStepValues(templatedSteps.compression, ["multilayer", "compression"], 1);
    const prioritizedPressureRelief = prioritizeStepValues(templatedSteps.pressure_relief, ["offloading", "heel", "reposition", "support surface"], 2);

    const fallbackAllowed = (optionText) => !isSupplyOptionExcluded({ category: "", treatment_option: optionText }) && isSuggestionEnabled(optionText);
    const fallbackSteps = (values, maxCount = 2) => uniqueNonEmpty(values.filter((value) => fallbackAllowed(value))).slice(0, Math.max(1, maxCount));

    const effectiveCleanser = prioritizedCleanser.length
      ? prioritizedCleanser
      : fallbackSteps(
        context.potentialBioburden
          ? ["Dakin solution (dilute sodium hypochlorite, protocol-guided)", "Normal saline irrigation"]
          : ["Normal saline irrigation"],
        context.potentialBioburden ? 2 : 1,
      );
    const effectivePeriWound = prioritizedPeriWound.length
      ? prioritizedPeriWound
      : fallbackSteps(
        (context.exudateProxy || context.potentialBioburden || context.effectiveOdor === "moderate" || context.effectiveOdor === "strong_foul")
          ? ["Skin barrier film / barrier ointment"]
          : [],
        1,
      );
    const effectiveTopical = prioritizedTopical.length
      ? prioritizedTopical
      : fallbackSteps(
        context.potentialBioburden
          ? ["Hydrofera Blue (methylene blue/gentian violet foam)", "Silver dressing (foam, hydrofiber, alginate, etc.)"]
          : (context.cleanBed && context.granulating && context.stalled
            ? ["Collagen dressing"]
            : (context.slough >= 10 ? ["MediHoney gel/paste/sheets/alginate variants"] : [])),
        2,
      );
    const effectivePacking = prioritizedPacking.length
      ? prioritizedPacking
      : fallbackSteps(context.cavityLikely ? ["Gauze packing / ribbon"] : [], 1);
    const effectiveDressing = prioritizedDressing.length
      ? prioritizedDressing
      : fallbackSteps(
        context.exudateProxy
          ? ["Foam dressing (standard or silicone border)", "Calcium alginate dressing"]
          : ["Hydrogel (sheet/gel)"],
        2,
      );
    const effectiveSecondary = prioritizedSecondary.length
      ? prioritizedSecondary
      : fallbackSteps(context.exudateProxy ? ["Superabsorbent polymer dressing"] : [], 1);
    const effectiveFrequency = prioritizedFrequency.length
      ? prioritizedFrequency
      : fallbackSteps(
        (context.exudateProxy || context.potentialBioburden || context.debridementNeeded || context.effectiveInfectionSigns?.length)
          ? ["Daily and PRN for saturation/soiling"]
          : ["Every 48-72 hours and PRN soiling"],
        1,
      );
    const effectiveCompression = prioritizedCompression.length
      ? prioritizedCompression
      : fallbackSteps((context.woundPathway === "venous" && !context.arterialRelated) ? ["Multilayer compression bandaging"] : [], 1);
    const effectivePressureRelief = prioritizedPressureRelief.length
      ? prioritizedPressureRelief
      : fallbackSteps(
        (context.pressureReliefNeeded || context.woundPathway === "pressure")
          ? ["Repositioning schedule (e.g., q2h while bedbound)", "Heel offloading boots / heel suspension"]
          : (context.woundPathway === "diabetic_foot"
            ? ["Removable knee-high walker"]
            : []),
        2,
      );

    const orderedSteps = [];
    const pushStep = (title, values) => {
      const items = Array.isArray(values) ? values.filter(Boolean) : [];
      if (!items.length) return;
      orderedSteps.push({ title, text: items.join("; "), values: items });
    };

    if (!debridementGate.allowDebridement && (context.debridementNeeded || context.slough >= 10 || context.worsening)) {
      orderedSteps.push({
        title: "Debridement Consideration",
        text: `Hold debridement technique selection pending: ${debridementGate.holdReasons.join("; ")}.`,
        values: [],
      });
    } else if (context.heelStableEscharException) {
      orderedSteps.push({
        title: "Debridement Consideration",
        text: "Primary: Evaluate for stable dry heel eschar pathway before debridement",
        values: ["Stable dry heel eschar conservative pathway"],
      });
    } else if (debridementPlan.length) {
      const [primaryPlan, ...altPlan] = debridementPlan;
      const primary = primaryPlan.option;
      const alt = altPlan.map((item) => item.option);
      orderedSteps.push({
        title: "Debridement Consideration",
        text: alt.length
          ? `Consider debridement if needed. Primary: ${primary}. Alternatives: ${alt.join("; ")}`
          : `Consider debridement if needed. Primary: ${primary}`,
        values: [primary, ...alt],
      });
    } else if (prioritizedDebridement.length) {
      const [primary, ...alt] = prioritizedDebridement;
      orderedSteps.push({
        title: "Debridement Consideration",
        text: alt.length
          ? `Consider debridement if needed. Primary: ${primary}. Alternatives: ${alt.join("; ")}`
          : `Consider debridement if needed. Primary: ${primary}`,
        values: [primary, ...alt],
      });
    }

    pushStep("Cleanser", effectiveCleanser);
    pushStep("Peri-wound", effectivePeriWound);
    pushStep("Topical Treatment", effectiveTopical);
    pushStep("Wound Packing", effectivePacking);
    pushStep("Wound Dressing", effectiveDressing);
    pushStep("Secondary Dressing", effectiveSecondary);
    pushStep("Change Frequency", effectiveFrequency);
    pushStep("Compression", effectiveCompression);
    pushStep("Pressure Relief", effectivePressureRelief);

    if (!orderedSteps.length) {
      return {
        text: "1) Continue Current Plan: No specific treatment steps were triggered from available export fields.",
        rationaleBlocks: [],
      };
    }

    const safetyLines = safetyChecks.map((check) => `Safety Check: ${check.text}`);
    const lines = orderedSteps.map((step, idx) => `${idx + 1}) ${step.title}: ${step.text}`);
    let orderedLines = lines;
    if (orderedSteps[0]?.title === "Debridement Consideration" && lines.length > 1) {
      orderedLines = [lines[0], "", ...lines.slice(1)];
    }

    const finalText = !safetyLines.length ? orderedLines.join("\n") : [...orderedLines, "", ...safetyLines].join("\n");
    const rationaleBlocks = orderedSteps
      .map((step, idx) => ({
        step_number: idx + 1,
        title: step.title,
        items: buildStepRationaleItems(step.values || [], treatments),
      }))
      .filter((block) => block.items.length);

    return { text: finalText, rationaleBlocks };
  }

  function buildRowId(latest) {
    return [
      String(latest?.mrn || "").trim(),
      String(latest?.wound_number || "").trim(),
      normalizeText(latest?.location || ""),
      toIsoDate(latest?.assessment_date) || "",
    ].join("|");
  }

  function toFiniteNumberOrNull(value, decimals = null) {
    if (value == null || value === "") return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    if (decimals == null) return n;
    return Number(n.toFixed(decimals));
  }

  function buildWoundSnapshotKeyFromParts(mrn, woundNumber, locationKey) {
    return [String(mrn || "").trim(), String(woundNumber || "").trim(), normalizeText(locationKey || "")].join("|");
  }

  function buildWoundSnapshotKey(rowLike) {
    return buildWoundSnapshotKeyFromParts(
      rowLike?.mrn,
      rowLike?.wound_number,
      rowLike?.location,
    );
  }

  function buildWoundLookupKeys(rowLike) {
    const mrn = String(rowLike?.mrn || "").trim();
    if (!mrn) return [];
    const woundNumber = String(rowLike?.wound_number || "").trim();
    const locationKey = normalizeText(rowLike?.location || "");
    const keys = [
      buildWoundSnapshotKeyFromParts(mrn, woundNumber, locationKey),
    ];
    if (woundNumber) keys.push(buildWoundSnapshotKeyFromParts(mrn, woundNumber, ""));
    if (locationKey) keys.push(buildWoundSnapshotKeyFromParts(mrn, "", locationKey));
    return Array.from(new Set(keys.filter(Boolean)));
  }

  function parseWoundSnapshotKey(key) {
    const parts = String(key || "").split("|");
    return {
      mrn: parts[0] || "",
      woundNumber: parts[1] || "",
      locationKey: parts.slice(2).join("|") || "",
    };
  }

  function buildTimelinePointFromRecordLike(recordLike, meta = {}) {
    const assessmentDateIso = toIsoDate(recordLike?.assessment_date);
    if (!assessmentDateIso) return null;

    const point = {
      assessment_date: assessmentDateIso,
      area_cm2: toFiniteNumberOrNull(recordLike?.area_cm2, 2),
      depth_cm: toFiniteNumberOrNull(recordLike?.depth_cm, 2),
      slough_pct_mid: toFiniteNumberOrNull(
        recordLike?.slough_pct_mid != null ? recordLike?.slough_pct_mid : recordLike?.slough_pct,
        1,
      ),
      eschar_pct_mid: toFiniteNumberOrNull(
        recordLike?.eschar_pct_mid != null ? recordLike?.eschar_pct_mid : recordLike?.eschar_pct,
        1,
      ),
      granulation_pct_mid: toFiniteNumberOrNull(
        recordLike?.granulation_pct_mid != null ? recordLike?.granulation_pct_mid : recordLike?.granulation_pct,
        1,
      ),
      status: String(recordLike?.status || "").trim(),
      stage: String(recordLike?.stage || "").trim(),
      source_report_id: String(meta.source_report_id || "").trim(),
      source_report_end_date: String(meta.source_report_end_date || "").trim(),
      source_generated_at: String(meta.source_generated_at || "").trim(),
    };

    return point;
  }

  function dedupeSortTimelinePoints(points) {
    const deduped = new Map();
    for (const point of points || []) {
      if (!point || !point.assessment_date) continue;
      const key = [
        point.assessment_date,
        point.area_cm2 ?? "",
        point.depth_cm ?? "",
        point.slough_pct_mid ?? "",
        point.granulation_pct_mid ?? "",
        normalizeText(point.status || ""),
        normalizeText(point.stage || ""),
      ].join("|");
      if (!deduped.has(key)) deduped.set(key, point);
    }

    return Array.from(deduped.values()).sort((a, b) => {
      const ad = parseDate(a.assessment_date);
      const bd = parseDate(b.assessment_date);
      const at = ad ? ad.getTime() : -Infinity;
      const bt = bd ? bd.getTime() : -Infinity;
      if (at !== bt) return at - bt;
      return String(a.source_generated_at || "").localeCompare(String(b.source_generated_at || ""));
    });
  }

  function toRecordLikeFromTimelinePoint(point, latestFallback = null) {
    if (!point) return null;
    return {
      mrn: String(latestFallback?.mrn || "").trim(),
      wound_number: String(latestFallback?.wound_number || "").trim(),
      location: String(latestFallback?.location || "").trim(),
      wound_type: String(latestFallback?.wound_type || "").trim(),
      assessment_date: parseDate(point.assessment_date),
      stage: String(point.stage || ""),
      status: String(point.status || ""),
      area_cm2: toFiniteNumberOrNull(point.area_cm2, 2) ?? 0,
      depth_cm: toFiniteNumberOrNull(point.depth_cm, 2) ?? 0,
      slough_pct: toFiniteNumberOrNull(point.slough_pct_mid, 1) ?? 0,
      eschar_pct: toFiniteNumberOrNull(point.eschar_pct_mid, 1) ?? 0,
      granulation_pct: toFiniteNumberOrNull(point.granulation_pct_mid, 1) ?? 0,
      slough_documented: point.slough_pct_mid != null,
      eschar_documented: point.eschar_pct_mid != null,
      epithelialization_pct: 0,
      epithelialization_documented: false,
      granulation_documented: point.granulation_pct_mid != null,
      length_cm: 0,
      width_cm: 0,
      stage_score: stageScore(point.stage || ""),
    };
  }

  function buildTimelinePointsForWound(latest, woundRecords = [], historicalSnapshots = []) {
    const points = [];
    for (const rec of woundRecords || []) {
      const point = buildTimelinePointFromRecordLike(rec, { source_report_id: "current_entry" });
      if (point) points.push(point);
    }

    const lookupKeys = new Set(buildWoundLookupKeys(latest));
    const mrn = String(latest?.mrn || "").trim();
    const woundNumber = String(latest?.wound_number || "").trim();
    const locationKey = normalizeText(latest?.location || "");

    for (const snapshot of historicalSnapshots || []) {
      if (!snapshot || typeof snapshot !== "object") continue;
      const timelineMap = snapshot.wound_timelines && typeof snapshot.wound_timelines === "object" ? snapshot.wound_timelines : {};
      const woundMap = snapshot.wounds && typeof snapshot.wounds === "object" ? snapshot.wounds : {};
      const allKeys = new Set([...Object.keys(timelineMap), ...Object.keys(woundMap)]);

      const matchedKeys = [];
      for (const key of allKeys) {
        if (lookupKeys.has(key)) matchedKeys.push(key);
      }
      if (!matchedKeys.length) {
        for (const key of allKeys) {
          const parsed = parseWoundSnapshotKey(key);
          if (!parsed.mrn || parsed.mrn !== mrn) continue;
          if (woundNumber && parsed.woundNumber === woundNumber) {
            matchedKeys.push(key);
            continue;
          }
          if (!woundNumber && locationKey && parsed.locationKey === locationKey) {
            matchedKeys.push(key);
          }
        }
      }

      const uniqueMatchedKeys = Array.from(new Set(matchedKeys));
      for (const key of uniqueMatchedKeys) {
        const timelineEntry = timelineMap[key];
        const entryPoints = Array.isArray(timelineEntry?.points) ? timelineEntry.points : [];
        if (entryPoints.length) {
          for (const point of entryPoints) {
            const normalizedPoint = buildTimelinePointFromRecordLike(point, {
              source_report_id: point?.source_report_id || snapshot.report_id || "",
              source_report_end_date: point?.source_report_end_date || snapshot.report_end_date || "",
              source_generated_at: point?.source_generated_at || snapshot.generated_at || "",
            });
            if (normalizedPoint) points.push(normalizedPoint);
          }
          continue;
        }

        const woundEntry = woundMap[key];
        if (!woundEntry) continue;
        const fallbackPoint = buildTimelinePointFromRecordLike(woundEntry, {
          source_report_id: snapshot.report_id || "",
          source_report_end_date: snapshot.report_end_date || "",
          source_generated_at: snapshot.generated_at || "",
        });
        if (fallbackPoint) points.push(fallbackPoint);
      }
    }

    return dedupeSortTimelinePoints(points);
  }

  function findCurrentTimelineIndex(timelinePoints, latest) {
    const latestDate = toIsoDate(latest?.assessment_date);
    if (!latestDate || !Array.isArray(timelinePoints) || !timelinePoints.length) return -1;

    let idx = -1;
    const latestArea = toFiniteNumberOrNull(latest?.area_cm2, 2);
    const latestDepth = toFiniteNumberOrNull(latest?.depth_cm, 2);
    for (let i = 0; i < timelinePoints.length; i += 1) {
      const point = timelinePoints[i];
      if (!point || point.assessment_date !== latestDate) continue;
      const areaMatches = latestArea == null || point.area_cm2 == null || Number(point.area_cm2) === Number(latestArea);
      const depthMatches = latestDepth == null || point.depth_cm == null || Number(point.depth_cm) === Number(latestDepth);
      if (areaMatches && depthMatches) idx = i;
    }

    if (idx >= 0) return idx;
    for (let i = timelinePoints.length - 1; i >= 0; i -= 1) {
      if (timelinePoints[i]?.assessment_date === latestDate) return i;
    }
    return timelinePoints.length - 1;
  }

  function buildOverrideDefaultsFromContext(ctx) {
    return {
      diabetic: "",
      thickness: "",
      exudate_amount: "",
      exudate_type: "",
      odor: "",
      exposed_structures: [],
      infection_signs: [],
    };
  }

  function buildDetailedRow(latest, previous, woundRecords = [], manualOverrides = null, timelinePoints = null, timelineCurrentIndex = -1) {
    const manual = manualOverrides ? normalizeManualOverrides(manualOverrides) : null;
    const ctx = buildContext(latest, previous, manual);
    const recs = buildRecommendations(latest, previous, manual);
    const treatments = buildTreatmentSuggestions(latest, previous, manual);

    let areaChangePct = "";
    if (previous && previous.area_cm2 > 0) {
      areaChangePct = Number((((latest.area_cm2 - previous.area_cm2) / previous.area_cm2) * 100).toFixed(2));
    }

    let depthChangeCm = "";
    if (previous) depthChangeCm = Number((latest.depth_cm - previous.depth_cm).toFixed(2));

    const firstDate = woundRecords.map((x) => x.assessment_date).filter(Boolean).sort((a, b) => a - b)[0] || null;
    const refDate = latest.date_acquired || latest.admission_date || firstDate;
    let woundAgeDays = "";
    if (refDate && latest.assessment_date) woundAgeDays = dateDiffDays(new Date(latest.assessment_date), new Date(refDate));

    const categories = recs.map((r) => r.category).join(", ");
    const details = recs
      .map((r) => `[${r.priority.toUpperCase()}] ${r.category}: ${r.consideration} (Why: ${r.rationale})`)
      .join(" | ");

    const treatmentCategories = treatments.map((t) => t.category).join(", ");
    const treatmentOptions = treatments.map((t) => t.option).join("; ");
    const treatmentDetails = treatments
      .map((t) => `[${t.priority.toUpperCase()}] ${t.category}: ${t.option} (Why: ${t.rationale})`)
      .join(" | ");
    const debridementGate = evaluateDebridementSafetyGate(ctx);
    const debridementPlan = debridementGate.allowDebridement ? selectDebridementPlan(ctx) : [];
    const primaryDebridement = debridementGate.allowDebridement
      ? (debridementPlan[0]?.option || (ctx.heelStableEscharException ? "Stable heel eschar exception pathway" : ""))
      : "Hold debridement selection until safety gate is cleared";
    const alternateDebridement = debridementPlan.slice(1).map((item) => item.option).join("; ");
    const stepwiseResult = buildStepwiseConsiderations(latest, previous, treatments, manual);
    const safetyChecks = buildSafetyChecks(ctx, treatments).map((item) => item.text).join(" | ");
    const alerts = Array.from(new Set(treatments.map((t) => t.cautions).filter(Boolean))).join(" | ");
    const overrideStorageKey = buildWoundOverrideStorageKey(latest);
    const dataQualityFlags = buildDataQualityFlagsForRow(latest);
    const recommendationConfidence = computeRecommendationConfidence(latest, ctx, previous);

    return {
      row_id: buildRowId(latest),
      override_storage_key: overrideStorageKey,
      name: latest.name,
      mrn: latest.mrn,
      wound_type: latest.wound_type || "",
      wound_number: latest.wound_number,
      location: latest.location,
      assessment_date: toIsoDate(latest.assessment_date),
      stage: latest.stage,
      status: latest.status,
      size_documented: Boolean(latest.size_documented),
      status_documented: Boolean(latest.status_documented),
      length_cm: latest.length_cm,
      width_cm: latest.width_cm,
      depth_cm: latest.depth_cm,
      area_cm2: latest.area_cm2,
      previous_area_cm2: previous ? previous.area_cm2 : "",
      area_change_pct: areaChangePct,
      depth_change_cm: depthChangeCm,
      slough_pct_mid: Number(latest.slough_pct.toFixed(1)),
      eschar_pct_mid: Number(latest.eschar_pct.toFixed(1)),
      epithelialization_pct_mid: Number(latest.epithelialization_pct.toFixed(1)),
      granulation_pct_mid: Number(latest.granulation_pct.toFixed(1)),
      slough_documented: Boolean(latest.slough_documented),
      eschar_documented: Boolean(latest.eschar_documented),
      epithelialization_documented: Boolean(latest.epithelialization_documented),
      granulation_documented: Boolean(latest.granulation_documented),
      exudate_amount_text: latest.exudate_amount_text || "",
      exudate_type_text: latest.exudate_type_text || "",
      odor_text: latest.odor_text || "",
      tunneling_text: latest.tunneling_text || "",
      undermining_text: latest.undermining_text || "",
      exposed_structures_text: latest.exposed_structures_text || "",
      infection_signs_text: latest.infection_signs_text || "",
      periwound_text: latest.periwound_text || "",
      pain_text: latest.pain_text || "",
      exudate_amount_documented: Boolean(latest.exudate_amount_documented),
      exudate_type_documented: Boolean(latest.exudate_type_documented),
      odor_documented: Boolean(latest.odor_documented),
      tunneling_documented: Boolean(latest.tunneling_documented),
      undermining_documented: Boolean(latest.undermining_documented),
      exposed_structures_documented: Boolean(latest.exposed_structures_documented),
      infection_signs_documented: Boolean(latest.infection_signs_documented),
      periwound_documented: Boolean(latest.periwound_documented),
      pain_documented: Boolean(latest.pain_documented),
      wound_age_days: woundAgeDays,
      wound_pathway: ctx.woundPathway || "general",
      wound_pathway_label: pathwayDisplayName(ctx.woundPathway),
      wound_pathway_reason: pathwayReasonFromContext(ctx),
      is_worsening: ctx.worsening ? "Yes" : "No",
      potential_bioburden_flag: ctx.potentialBioburden ? "Yes" : "No",
      exudate_proxy_moderate_high: ctx.exudateProxy ? "Yes" : "No",
      data_quality_flags: dataQualityFlags,
      data_quality_is_weak: dataQualityFlags.length ? "Yes" : "No",
      recommendation_confidence_score: recommendationConfidence.score,
      recommendation_confidence_label: recommendationConfidence.label,
      recommendation_confidence_summary: recommendationConfidence.summary,
      consideration_categories: categories,
      consideration_details: details,
      recommendation_count: recs.length,
      treatment_categories: treatmentCategories,
      supplies_to_consider: treatmentOptions,
      debridement_primary_option: primaryDebridement,
      debridement_alternative_options: alternateDebridement,
      safety_checks: safetyChecks,
      stepwise_considerations: stepwiseResult.text,
      stepwise_rationale_blocks: stepwiseResult.rationaleBlocks,
      treatment_details: treatmentDetails,
      compatibility_alerts: alerts,
      report_signal_text: ctx.reportSignalText || "",
      report_exudate_amount_inferred: ctx.reportExudateAmount || "",
      report_exudate_type_inferred: ctx.reportExudateType || "",
      report_odor_inferred: ctx.reportOdor || "",
      report_infection_signs_inferred: (ctx.reportInfectionSigns || []).join("|"),
      report_exposed_structures_inferred: (ctx.reportExposedStructures || []).join("|"),
      effective_exudate_amount: ctx.effectiveExudateAmount || "",
      effective_exudate_type: ctx.effectiveExudateType || "",
      effective_odor: ctx.effectiveOdor || "",
      effective_infection_signs: (ctx.effectiveInfectionSigns || []).join("|"),
      effective_exposed_structures: (ctx.effectiveExposedStructures || []).join("|"),
      missing_inputs_to_refine_choice: manual
        ? "Manual override inputs applied for this wound row."
        : "Entry fields and trend data were used where available. Add rerun inputs to further tighten exudate/odor/infection/depth-structure decisioning.",
      manual_overrides: manual,
      override_defaults: buildOverrideDefaultsFromContext(ctx),
      _latest_source: latest,
      _previous_source: previous,
      _wound_records_source: Array.isArray(woundRecords) ? [...woundRecords] : [],
      _timeline_points_source: Array.isArray(timelinePoints) ? [...timelinePoints] : [],
      _timeline_current_index: Number.isInteger(timelineCurrentIndex) ? timelineCurrentIndex : -1,
    };
  }

  function buildLatestRows(records, historicalSnapshots = []) {
    const grouped = new Map();
    records.forEach((r) => {
      if (!grouped.has(r.wound_key)) grouped.set(r.wound_key, []);
      grouped.get(r.wound_key).push(r);
    });

    const rows = [];
    for (const woundRecords of grouped.values()) {
      woundRecords.sort((a, b) => {
        const ad = a.assessment_date ? a.assessment_date.getTime() : -Infinity;
        const bd = b.assessment_date ? b.assessment_date.getTime() : -Infinity;
        if (ad !== bd) return ad - bd;
        return a.stage_score - b.stage_score;
      });

      const latest = woundRecords[woundRecords.length - 1];
      const timelinePoints = buildTimelinePointsForWound(latest, woundRecords, historicalSnapshots);
      const currentTimelineIndex = findCurrentTimelineIndex(timelinePoints, latest);
      const previousPoint = (currentTimelineIndex > 0 && timelinePoints[currentTimelineIndex - 1])
        ? timelinePoints[currentTimelineIndex - 1]
        : null;
      const previous = previousPoint ? toRecordLikeFromTimelinePoint(previousPoint, latest) : (woundRecords.length > 1 ? woundRecords[woundRecords.length - 2] : null);
      const embeddedManual = latest.manual_overrides && hasAnyManualOverride(latest.manual_overrides)
        ? normalizeManualOverrides(latest.manual_overrides)
        : null;
      const storedManual = embeddedManual || getStoredManualOverrides(latest);
      rows.push(buildDetailedRow(latest, previous, woundRecords, storedManual, timelinePoints, currentTimelineIndex));
    }

    return rows;
  }

  function buildDisplayRows(rows) {
    return rows.map((row) => ({
      patient_name: normalizePersonName(row.name || ""),
      wound_type: row.wound_type || row.stage || "Not documented",
      considerations: [
        buildWeekToWeekLine(row),
        buildDataQualityLine(row),
        row.stepwise_considerations || row.supplies_to_consider || row.treatment_categories || "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    }));
  }


  function buildPrintPacketHtml(detailedRows = []) {
    const rows = Array.isArray(detailedRows) ? detailedRows : [];
    if (!rows.length) return '<p class="narrative-empty">No wound entries were generated yet.</p>';

    const windowStart = toIsoDate(latestOutputs?.meta?.report_start_date) || "unknown";
    const windowEnd = toIsoDate(latestOutputs?.meta?.report_end_date) || "unknown";
    const generatedAt = new Date().toISOString().replace("T", " ").replace("Z", " UTC");
    const groups = new Map();
    rows.forEach((row) => {
      const patientName = normalizePersonName(String(row?.name || "").trim()) || "Unknown patient";
      const patientMrn = String(row?.mrn || "").trim();
      const key = `${patientName}|${patientMrn}`;
      if (!groups.has(key)) groups.set(key, { patientName, patientMrn, wounds: [] });
      groups.get(key).wounds.push(row);
    });

    const patientBlocks = Array.from(groups.values()).map((patient) => {
      const woundBlocks = patient.wounds.map((row) => {
        const locationLabel = String(row?.location || "").trim();
        const woundLabel = locationLabel ? `Wound - ${locationLabel}` : "Wound";
        const woundType = String(row?.wound_type || row?.stage || "Not documented").trim() || "Not documented";
        const location = String(row?.location || "").trim() || "Not documented";
        const measure = `${formatNarrativeNumber(row?.length_cm, 2) || "0"} x ${formatNarrativeNumber(row?.width_cm, 2) || "0"} x ${formatNarrativeNumber(row?.depth_cm, 2) || "0"} cm`;
        const area = formatNarrativeNumber(row?.area_cm2, 2) || "0";
        const status = String(row?.status || "").trim() || "Not charted";
        const responseLine = buildWeekToWeekLine(row);
        const qualityLine = buildDataQualityLine(row);
        const planText = String(row?.stepwise_considerations || row?.supplies_to_consider || row?.treatment_categories || "")
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .join("<br/>");

        return `
          <article class="print-wound">
            <h4>${escapeHtml(`${woundLabel} - ${woundType}`)}</h4>
            <p><strong>Location:</strong> ${escapeHtml(location)}</p>
            <p><strong>Size:</strong> ${escapeHtml(measure)} (Area ${escapeHtml(area)} cm2)</p>
            <p><strong>Status:</strong> ${escapeHtml(status)}</p>
            ${responseLine ? `<p><strong>Response:</strong> ${escapeHtml(responseLine.replace(/^Response Score:\s*/i, ""))}</p>` : ""}
            ${qualityLine ? `<p><strong>${escapeHtml(qualityLine)}</strong></p>` : ""}
            ${planText ? `<p><strong>Plan:</strong><br/>${planText}</p>` : ""}
          </article>
        `;
      }).join("");

      return `
        <section class="print-patient">
          <header class="print-patient-header">
            <h3 class="print-patient-name">${escapeHtml(patient.patientName)}</h3>
            <p class="print-patient-meta">${escapeHtml(`Assessment Window: ${windowStart} -> ${windowEnd}`)}</p>
            <p class="print-patient-meta">${escapeHtml(`Generated: ${generatedAt}`)}</p>
          </header>
          ${woundBlocks}
        </section>
      `;
    }).join("");

    return patientBlocks;
  }

  function exitPrintPacketMode() {
    document.body.classList.remove("print-packet-mode");
    if (els.printPacketPanel) {
      els.printPacketPanel.classList.add("hidden");
      els.printPacketPanel.setAttribute("aria-hidden", "true");
    }
  }

  function openPrintPacket() {
    if (!latestOutputs || !Array.isArray(latestOutputs.detailedRows) || !latestOutputs.detailedRows.length) {
      setStatus("Generate considerations first, then print the patient packet.");
      return;
    }
    if (!els.printPacketPanel || !els.printPacketContent) return;
    els.printPacketContent.innerHTML = buildPrintPacketHtml(latestOutputs.detailedRows);
    els.printPacketPanel.classList.remove("hidden");
    els.printPacketPanel.setAttribute("aria-hidden", "false");
    document.body.classList.add("print-packet-mode");
    window.setTimeout(() => {
      window.print();
      window.setTimeout(exitPrintPacketMode, 80);
    }, 60);
  }

  function formatNarrativeNumber(value, decimals = 2) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "";
    return n.toFixed(decimals).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  }

  function articleForPhrase(value) {
    const firstWord = normalizeText(value || "").split(/\s+/).filter(Boolean)[0] || "";
    if (!firstWord) return "a";
    if (/^(honest|honor|hour|heir)/.test(firstWord)) return "an";
    if (/^[aeiou]/.test(firstWord)) return "an";
    return "a";
  }

  function joinNarrativeList(items) {
    const list = (items || []).map((x) => String(x || "").trim()).filter(Boolean);
    if (!list.length) return "";
    if (list.length === 1) return list[0];
    if (list.length === 2) return `${list[0]} and ${list[1]}`;
    return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
  }

  function humanizeLocationText(locationRaw) {
    let text = String(locationRaw || "").trim().toLowerCase();
    if (!text) return "";

    text = text
      .replace(/[_,]+/g, " ")
      .replace(/\s*\/\s*/g, " / ")
      .replace(/\s+/g, " ")
      .trim();

    text = text
      .replace(/\blle\b/g, "left lower extremity")
      .replace(/\brle\b/g, "right lower extremity")
      .replace(/\blue\b/g, "left upper extremity")
      .replace(/\brue\b/g, "right upper extremity")
      .replace(/\bbilat(?:eral)?\b/g, "bilateral")
      .replace(/\blt\b/g, "left")
      .replace(/\brt\b/g, "right")
      .replace(/\bl\b/g, "left")
      .replace(/\br\b/g, "right");

    const anatomyReplacements = [
      { re: /\bsacrum\b/g, value: "sacrum" },
      { re: /\bsacral\b/g, value: "sacrum" },
      { re: /\bcoccyx\b/g, value: "coccyx" },
      { re: /\bcoccygeal\b/g, value: "coccyx" },
      { re: /\bgluteal\b/g, value: "buttock" },
      { re: /\bbuttocks\b/g, value: "buttock" },
      { re: /\bischial\b/g, value: "ischium" },
      { re: /\bischial tuberosity\b/g, value: "ischium" },
      { re: /\btrochanteric\b/g, value: "greater trochanter" },
      { re: /\bhip\b/g, value: "hip" },
      { re: /\bheel\b/g, value: "heel" },
      { re: /\bcalcaneal\b/g, value: "heel" },
      { re: /\bankle\b/g, value: "ankle" },
      { re: /\bmalleolar\b/g, value: "malleolus" },
      { re: /\bshin\b/g, value: "anterior shin" },
      { re: /\bpretibial\b/g, value: "anterior shin" },
      { re: /\btibial\b/g, value: "anterior shin" },
      { re: /\btoe\b/g, value: "toe" },
      { re: /\btoes\b/g, value: "toes" },
      { re: /\bmetatarsal head\b/g, value: "metatarsal head" },
      { re: /\bforefoot\b/g, value: "forefoot" },
      { re: /\bmidfoot\b/g, value: "midfoot" },
      { re: /\bplantar\b/g, value: "plantar foot" },
      { re: /\bdorsal\b/g, value: "dorsum of foot" },
      { re: /\bleg\b/g, value: "leg" },
      { re: /\bcalf\b/g, value: "calf" },
      { re: /\bknee\b/g, value: "knee" },
      { re: /\bthigh\b/g, value: "thigh" },
      { re: /\belbow\b/g, value: "elbow" },
      { re: /\bforearm\b/g, value: "forearm" },
      { re: /\bhand\b/g, value: "hand" },
      { re: /\bfinger\b/g, value: "finger" },
      { re: /\bback\b/g, value: "back" },
      { re: /\bspine\b/g, value: "spine" },
      { re: /\bchest\b/g, value: "chest" },
      { re: /\baxillary\b/g, value: "axilla" },
      { re: /\binguinal\b/g, value: "groin" },
      { re: /\bperineal\b/g, value: "perineum" },
      { re: /\bperirectal\b/g, value: "perirectal area" },
      { re: /\bperianal\b/g, value: "perianal area" },
      { re: /\bscrotal\b/g, value: "scrotum" },
      { re: /\bvaginal\b/g, value: "vaginal area" },
      { re: /\babdominal\b/g, value: "abdomen" },
      { re: /\bsternal\b/g, value: "sternum" },
    ];

    anatomyReplacements.forEach((entry) => {
      text = text.replace(entry.re, entry.value);
    });

    text = text
      .replace(/\b(left|right)\s+plantar foot\b/g, "plantar surface of the $1 foot")
      .replace(/\b(left|right)\s+dorsum of foot\b/g, "dorsum of the $1 foot")
      .replace(/\bplantar foot\b/g, "plantar surface of the foot")
      .replace(/\bdorsum of foot\b/g, "dorsum of the foot")
      .replace(/\b(left|right)\s+greater trochanter\b/g, "$1 hip (greater trochanter)")
      .replace(/\b(left|right)\s+ischium\b/g, "$1 ischium")
      .replace(/\bleft lower extremity\b/g, "left leg")
      .replace(/\bright lower extremity\b/g, "right leg")
      .replace(/\bleft upper extremity\b/g, "left arm")
      .replace(/\bright upper extremity\b/g, "right arm")
      .replace(/\s+/g, " ")
      .replace(/^(on|at|over|to)\s+/, "")
      .trim();

    return text;
  }

  function humanizeWoundTypeText(rawWoundType) {
    let text = String(rawWoundType || "").trim().toLowerCase();
    if (!text) return "wound type not specified";

    text = text
      .replace(/[_,]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const woundTypeReplacements = [
      { re: /\bdtpi\b/g, value: "deep tissue pressure injury" },
      { re: /\bpi\b/g, value: "pressure injury" },
      { re: /\bpressure ulcer\b/g, value: "pressure injury" },
      { re: /\bdfu\b/g, value: "diabetic foot ulcer" },
      { re: /\bvlu\b/g, value: "venous leg ulcer" },
      { re: /\biad\b/g, value: "incontinence-associated dermatitis" },
      { re: /\bmasd\b/g, value: "moisture-associated skin damage" },
      { re: /\bneuropathic ulcer\b/g, value: "neuropathic ulcer" },
      { re: /\barterial ulcer\b/g, value: "arterial ulcer" },
      { re: /\bvenous ulcer\b/g, value: "venous ulcer" },
      { re: /\btraumatic wound\b/g, value: "traumatic wound" },
      { re: /\bsurgical wound\b/g, value: "surgical wound" },
      { re: /\bskin tear\b/g, value: "skin tear" },
      { re: /\bdehisced wound\b/g, value: "dehisced wound" },
      { re: /\bburn wound\b/g, value: "burn wound" },
      { re: /\bunstageable\b/g, value: "unstageable pressure injury" },
      { re: /\bmartorell ulcer\b/g, value: "Martorell hypertensive ischemic ulcer" },
      { re: /\bhilu\b/g, value: "hypertensive ischemic leg ulcer" },
      { re: /\bvasculitic ulcer\b/g, value: "vasculitic ulcer" },
      { re: /\bhidradenitis suppurativa\b/g, value: "hidradenitis suppurativa" },
      { re: /\bhs\b/, value: "hidradenitis suppurativa" },
      { re: /\bgraft wound\b/g, value: "graft wound" },
      { re: /\bstsg\b/g, value: "split-thickness skin graft" },
      { re: /\bftsg\b/g, value: "full-thickness skin graft" },
      { re: /\bosteomyelitis\b/g, value: "osteomyelitis" },
      { re: /\bradiation wound\b/g, value: "radiation wound" },
      { re: /\born\b/, value: "osteoradionecrosis" },
      { re: /\bpg\b/, value: "pyoderma gangrenosum" },
    ];
    woundTypeReplacements.forEach((entry) => {
      text = text.replace(entry.re, entry.value);
    });

    text = text
      .replace(/\bstage\s*i+\b/gi, (m) => m.toUpperCase())
      .replace(/\btype\s*1\b/g, "type 1")
      .replace(/\btype\s*2\b/g, "type 2")
      .trim();

    return text;
  }

  function buildNarrativeLocationPhrase(locationRaw) {
    const text = humanizeLocationText(locationRaw);
    if (!text) return "at a location not clearly listed in the report";
    if (text.startsWith("plantar surface of the")) return `on the ${text.replace("of the ", "of their ")}`;
    if (text.startsWith("dorsum of the")) return `on the ${text.replace("of the ", "of their ")}`;
    if (text.startsWith("left ") || text.startsWith("right ") || text.startsWith("bilateral ")) return `on their ${text}`;
    if (text.includes("groin") || text.includes("axilla")) return `in their ${text}`;
    return `on their ${text}`;
  }

  function buildTrendNarrative(row) {
    const signal = String(row.treatment_effect_signal || "").trim();
    const rationale = String(row.treatment_effect_rationale || "").trim();
    if (!signal) return "";
    if (signal === "No prior wound match") return "";
    if (rationale) {
      return fillTemplate(getNarrativePhrase("trend_line_with_reason"), {
        signal: signal.toLowerCase(),
        reason: rationale,
      });
    }
    return fillTemplate(getNarrativePhrase("trend_line_without_reason"), {
      signal: signal.toLowerCase(),
    });
  }

  function buildTissueNarrative(row) {
    const sloughDocumented = Boolean(row.slough_documented);
    const escharDocumented = Boolean(row.eschar_documented);
    const epithelializationDocumented = Boolean(row.epithelialization_documented);
    const granulationDocumented = Boolean(row.granulation_documented);

    const parts = [];
    if (sloughDocumented && Number(row.slough_pct_mid) > 0) parts.push(`slough at ${formatNarrativeNumber(row.slough_pct_mid, 1)}%`);
    if (escharDocumented && Number(row.eschar_pct_mid) > 0) parts.push(`eschar at ${formatNarrativeNumber(row.eschar_pct_mid, 1)}%`);
    if (epithelializationDocumented && Number(row.epithelialization_pct_mid) > 0) parts.push(`epithelialization at ${formatNarrativeNumber(row.epithelialization_pct_mid, 1)}%`);
    if (granulationDocumented && Number(row.granulation_pct_mid) > 0) parts.push(`red granulation at ${formatNarrativeNumber(row.granulation_pct_mid, 1)}%`);
    if (!parts.length) return "";
    return fillTemplate(getNarrativePhrase("tissue_line"), {
      details: joinNarrativeList(parts),
    });
  }

  function buildStatusNarrative(row) {
    const rawStatus = String(row?.status || "").trim();
    const status = normalizeText(rawStatus);
    const stage = normalizeText(row?.stage || "");
    const trend = normalizeText(row?.treatment_effect_signal || "");
    const length = Number(row?.length_cm || 0);
    const width = Number(row?.width_cm || 0);
    const depth = Number(row?.depth_cm || 0);
    const area = Number(row?.area_cm2 || 0);
    const hasActiveMeasurements = length > 0 || width > 0 || depth > 0 || area > 0;
    const hasTissueDescriptors =
      (Boolean(row?.slough_documented) && Number(row?.slough_pct_mid || 0) > 0) ||
      (Boolean(row?.eschar_documented) && Number(row?.eschar_pct_mid || 0) > 0) ||
      (Boolean(row?.epithelialization_documented) && Number(row?.epithelialization_pct_mid || 0) > 0) ||
      (Boolean(row?.granulation_documented) && Number(row?.granulation_pct_mid || 0) > 0);
    const stageSuggestsActive =
      stage.includes("stage") ||
      stage.includes("unstageable") ||
      stage.includes("deep tissue");

    const phrase = (key, vars = {}) => fillTemplate(getNarrativePhrase(key), vars);

    if (!status) {
      if (trend.includes("improving")) return phrase("status_improving");
      if (trend.includes("worsening") || trend.includes("not working")) return phrase("status_worsening");
      if (trend.includes("mixed")) return phrase("status_mixed");
      return phrase("status_active");
    }

    if (
      statusIndicatesNegatedHealing(status) ||
      status.includes("not healing") ||
      status.includes("non-healing") ||
      status.includes("stalled") ||
      status.includes("unchanged")
    ) {
      if (trend.includes("worsening") || trend.includes("not working") || status.includes("deteriorat") || status.includes("worsen")) {
        return phrase("status_worsening");
      }
      return phrase("status_stalled");
    }

    if (statusIndicatesHealed(status)) {
      if (hasActiveMeasurements || hasTissueDescriptors || stageSuggestsActive) {
        return phrase("status_healed_conflict");
      }
      return phrase("status_healed");
    }
    if (status.includes("healing") || status.includes("improv")) {
      return phrase("status_improving");
    }
    if (status.includes("deteriorat") || status.includes("worsen") || status.includes("declin")) {
      return phrase("status_worsening");
    }
    if (status.includes("new")) {
      return phrase("status_new");
    }

    return phrase("status_charted_fallback", { status: rawStatus });
  }

  function buildManualOverrideNarrative(row) {
    const manual = normalizeManualOverrides(row?.manual_overrides || {});
    if (!hasAnyManualOverride(manual)) return "";

    const toLowerPhrase = (value) => normalizeText(value).trim();
    const capFirst = (value) => {
      const text = String(value || "").trim();
      return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : "";
    };

    const sentences = [];

    if (manual.diabetic === "yes") sentences.push("The patient has diabetes.");
    else if (manual.diabetic === "no") sentences.push("Diabetes is not indicated.");

    const woundDetails = [];
    if (manual.thickness) {
      const thickness = toLowerPhrase(labelForOverrideValue(manual.thickness));
      if (thickness) woundDetails.push(`the wound is ${thickness}`);
    }

    const exudateAmount = manual.exudate_amount ? toLowerPhrase(labelForOverrideValue(manual.exudate_amount)) : "";
    const exudateType = manual.exudate_type ? toLowerPhrase(labelForOverrideValue(manual.exudate_type)) : "";
    if (exudateAmount || exudateType) {
      if (exudateAmount && exudateType) woundDetails.push(`drainage is ${exudateAmount} and ${exudateType}`);
      else if (exudateAmount) woundDetails.push(`drainage is ${exudateAmount}`);
      else woundDetails.push(`drainage is ${exudateType}`);
    }

    if (manual.odor) {
      const odor = toLowerPhrase(labelForOverrideValue(manual.odor));
      if (odor === "none") woundDetails.push("no odor is noted");
      else if (odor) woundDetails.push(`odor is ${odor}`);
    }

    if (woundDetails.length) {
      sentences.push(`${capFirst(woundDetails.join(", "))}.`);
    }

    const exposedLabels = labelsForOverrideValues(manual.exposed_structures).map((value) => toLowerPhrase(value));
    if (exposedLabels.length) {
      sentences.push(`Exposed structures include ${joinNarrativeList(exposedLabels)}.`);
    }

    const infectionLabels = labelsForOverrideValues(manual.infection_signs).map((value) => toLowerPhrase(value));
    if (infectionLabels.length) {
      sentences.push(`Local infection signs include ${joinNarrativeList(infectionLabels)}.`);
    }

    const detailText = sentences.join(" ").replace(/\s+/g, " ").trim();
    if (!detailText) return "";

    const wrapper = getNarrativePhrase("manual_override_line");
    if (wrapper && wrapper.includes("{details}") && !/rerun/i.test(wrapper)) {
      return fillTemplate(wrapper, { details: detailText });
    }
    return detailText;
  }

  function buildSpecialTypeNarrativeNote(c) {
    if (c.necrotizingFasciitis) return "This wound is being managed as suspected necrotizing fasciitis, a surgical emergency requiring immediate operative intervention.";
    if (c.calciphylaxisWound) return "This wound is associated with calciphylaxis; systemic management (sodium thiosulfate, phosphate control, nephrology coordination) is the primary treatment priority.";
    if (c.malignantWound) return "This wound is a malignant or fungating wound; management is palliative and directed toward comfort, odor control, and bleeding prevention in coordination with oncology.";
    if (c.pyodermaGangrenosum) return "This wound is consistent with pyoderma gangrenosum; debridement is contraindicated due to pathergy risk, and treatment requires specialist-directed immunosuppressive therapy.";
    if (c.osteomyelitisWound) return "This wound is associated with osteomyelitis; management requires diagnostic bone biopsy, culture-guided antibiotic therapy, and surgical coordination for necrotic bone debridement.";
    if (c.vasculiticUlcer) return "This wound is being managed as a vasculitic ulcer; systemic immunosuppressive management is required and compression is contraindicated.";
    if (c.martorell) return "This wound is being managed as a Martorell hypertensive ischemic ulcer (HILU); blood pressure control to target <130/80 mmHg is the primary disease-modifying intervention, and compression is absolutely contraindicated.";
    if (c.hidradenitisSuppurativa) return "This wound is associated with hidradenitis suppurativa; management is Hurley stage-directed and requires dermatology coordination for systemic therapy.";
    if (c.graftWound) return "This wound is a graft-related wound; care is specific to graft site (donor vs. recipient) and graft take status.";
    if (c.surgicalWound) return "This wound is a surgical wound or dehiscence; management is guided by wound depth, infection status, and fascial integrity.";
    if (c.radiationWound && !c.burnWound) return "This wound is radiation-related; management requires radiation oncology coordination and is graded by severity (CTCAE for acute dermatitis, Marx protocol for osteoradionecrosis).";
    if (c.fistulaWound) return "This wound is a fistula or enterocutaneous fistula; management centers on output classification, skin protection, nutritional support, and specialist surgical planning.";
    if (c.skinTear) return "This wound is classified as a skin tear; management follows ISTAP guidelines based on flap classification (Type 1/2/3).";
    if (c.masdRelated) return "This wound is moisture-associated skin damage; management requires structured skin care, barrier protection, and concurrent continence management.";
    if (c.burnWound && c.radiationWound) return "This wound is a radiation burn; management requires radiation oncology coordination and conservative wound care avoiding aggressive debridement.";
    if (c.burnWound) return "This wound is a burn; depth classification (superficial/partial/full-thickness) and TBSA assessment drive the management pathway.";
    return "";
  }

  function buildWoundNarrativeSegment(row, style = "detailed") {
    const woundTypeRaw = String(row.wound_type || row.stage || "wound type not specified").trim() || "wound type not specified";
    const woundType = humanizeWoundTypeText(woundTypeRaw);
    const woundNumber = String(row.wound_number || "").trim();
    const location = String(row.location || "").trim();
    const stage = String(row.stage || "").trim();
    const pathway = String(row.wound_pathway_label || pathwayDisplayName(row.wound_pathway) || "General").trim();
    const trendNarrative = buildTrendNarrative(row);
    const statusNarrative = buildStatusNarrative(row);
    const manualNarrative = buildManualOverrideNarrative(row);
    const tissueNarrative = buildTissueNarrative(row);

    const woundRef = woundNumber ? `wound #${woundNumber}` : "this wound";
    const locationPhrase = buildNarrativeLocationPhrase(location);
    const woundArticle = articleForPhrase(woundType);

    const length = formatNarrativeNumber(row.length_cm, 2);
    const width = formatNarrativeNumber(row.width_cm, 2);
    const depth = formatNarrativeNumber(row.depth_cm, 2);
    const area = formatNarrativeNumber(row.area_cm2, 2);
    const normalizedStyle = normalizeNarrativeStyle(style);

    const measurementSentence = (length || width || depth || area)
      ? fillTemplate(getNarrativePhrase("measurement_line"), {
          length: length || "0",
          width: width || "0",
          depth: depth || "0",
          area: area || "0",
        })
      : getNarrativePhrase("measurement_unavailable_line");

    const stageSentence = stage ? `Stage at this visit: ${stage}.` : "";
    const pathwaySentence = fillTemplate(getNarrativePhrase("pathway_sentence"), {
      pathway_phrase: pathwayNarrativePhrase(pathway),
    });

    const lines = [
      fillTemplate(getNarrativePhrase("wound_line"), {
        wound_ref: woundRef,
        article: woundArticle,
        wound_type: woundType,
        location_phrase: locationPhrase,
      }),
      measurementSentence,
      statusNarrative,
    ];
    if (normalizedStyle === "detailed") {
      if (stageSentence) lines.push(stageSentence);
      if (pathwaySentence) lines.push(pathwaySentence);
      const specialNote = buildSpecialTypeNarrativeNote(buildContext(row, null, row.manual_overrides || null));
      if (specialNote) lines.push(specialNote);
      if (tissueNarrative) lines.push(tissueNarrative);
      if (manualNarrative) lines.push(manualNarrative);
    }
    if (trendNarrative) lines.push(trendNarrative);

    return lines.filter(Boolean).join(" ");
  }

  function expandLocAbbreviations(raw) {
    let s = String(raw || "").trim().toLowerCase().replace(/\s+/g, " ");
    // Laterality full words
    s = s.replace(/\b(rt|r\.)\b/g, "right");
    s = s.replace(/\b(lt|l\.)\b/g, "left");
    s = s.replace(/\(r\)/g, " right ");
    s = s.replace(/\(l\)/g, " left ");
    s = s.replace(/\bb\/l\b|\bbilat\b/g, "bilateral");
    // Standalone single-letter laterality (word boundary: space or start/end)
    s = s.replace(/(^| )r( |,|$)/g, "$1right$2");
    s = s.replace(/(^| )l( |,|$)/g, "$1left$2");
    // Common clinical abbreviations
    s = s.replace(/\ble\b/g, "left left-or-right lower extremity leg");   // "LE" = lower extremity
    s = s.replace(/\bue\b/g, "upper extremity arm forearm");              // "UE" = upper extremity
    s = s.replace(/\blower extremity\b|\blower ext\b|\blower limb\b/g, "lower extremity leg lower-leg");
    s = s.replace(/\bupper extremity\b|\bupper ext\b|\bupper limb\b/g, "upper extremity arm forearm");
    s = s.replace(/\bextremity\b/g, "extremity leg");                     // generic "extremity" treated as leg
    // Anatomical synonyms — expand so locHas picks them up
    s = s.replace(/\btrochant\w*/g, "hip trochanter");
    s = s.replace(/\bischial\b|\bischium\b/g, "ischial buttock");
    s = s.replace(/\bsacrococcyg\w*|\btailbone\b/g, "sacrum coccyx");
    s = s.replace(/\bpretibial\b|\bshin\b|\banterior leg\b/g, "lower leg calf shin pretibial");
    s = s.replace(/\bposterior leg\b|\bpost leg\b/g, "calf lower leg posterior");
    s = s.replace(/\bgaiter\b/g, "ankle gaiter");         // gaiter = ankle/lower leg junction
    s = s.replace(/\bmalleol\w*|\bperimalleolar\b/g, "ankle malleolus");
    s = s.replace(/\bplantar\b|\bsole\b|\barch\b/g, "plantar foot");
    s = s.replace(/\bdorsum\b|\bdorsal\b/g, "dorsum foot");
    s = s.replace(/\bhallux\b|\bgreat toe\b|\bbig toe\b|\b1st toe\b|\bfirst toe\b/g, "toe hallux");
    s = s.replace(/\bpopliteal\b/g, "knee popliteal");
    s = s.replace(/\boccipit\w*/g, "occiput head scalp");
    s = s.replace(/\btemporal\b|\bcheek\b|\bchin\b|\bforehead\b|\btemple\b/g, "face head");
    s = s.replace(/\bmetatarsal\b/g, "foot metatarsal toe");
    s = s.replace(/\btibi\w*|\bfibul\w*/g, "lower leg tibia calf");
    s = s.replace(/\bfemor\w*/g, "thigh femur");
    // "leg" alone stays as "leg" — do NOT expand to "lower leg" to avoid false calf matches
    return s.replace(/\s+/g, " ").trim();
  }

  function buildICD10Suggestions(row) {
    const c = buildContext(row, null, row.manual_overrides || null);
    const loc = expandLocAbbreviations(c.locationText);
    const suggestions = [];
    const add = (code, description, note = "") => suggestions.push({ code, description, note });

    const isRight = loc.includes("right");
    const isLeft  = loc.includes("left");
    const side    = isRight ? "1" : isLeft ? "2" : "9"; // laterality digit

    /* helpers */
    const locHas = (...terms) => terms.some((t) => loc.includes(t));

    /* ── Necrotizing Fasciitis ────────────────────────────── */
    if (c.necrotizingFasciitis) {
      add("M72.6",  "Necrotizing fasciitis");
      add("A48.0",  "Gas gangrene", "Use if clostridial (Type I)");
      add("B95.62", "MRSA as cause of NF", "Add when confirmed");
      return suggestions;
    }

    /* ── Pyoderma Gangrenosum ─────────────────────────────── */
    if (c.pyodermaGangrenosum) {
      add("L88", "Pyoderma gangrenosum");
      return suggestions;
    }

    /* ── Calciphylaxis ──────────────────────────────────────── */
    if (c.calciphylaxisWound) {
      add("E83.59", "Calciphylaxis (disorder of calcium metabolism)");
      add("N18.6",  "End-stage renal disease", "Add if dialysis-dependent");
      return suggestions;
    }

    /* ── Malignant / Fungating ──────────────────────────────── */
    if (c.malignantWound) {
      add("L98.499", "Non-pressure chronic ulcer, unspecified severity", "Underlying malignancy — add primary cancer code");
      add("C44.90",  "Unspecified malignant neoplasm of skin, unspecified", "Replace with specific C-code for tumor type/site");
      return suggestions;
    }

    /* ── Fistula ─────────────────────────────────────────────── */
    if (c.fistulaWound) {
      add("K63.2",  "Fistula of intestine");
      add("K60.3",  "Anal fistula", "Use if perianal");
      add("L98.8",  "Other specified disorders of the skin", "For cutaneous fistula opening/wound NOS");
      return suggestions;
    }

    /* ── Traumatic Wound ─────────────────────────────────────── */
    if (c.traumaticWound) {
      const isBite = c.woundTypeText.includes("bite");
      if (isBite) {
        add("W54.0XXA", "Dog bite, initial encounter", "W54=dog; W55=other animal; W50-W55 range for animal bites");
        add("S61.419A", "Open wound of unspecified finger, initial encounter", "Replace with site-specific S code for actual location");
        add("Z20.3",    "Contact with rabies", "Add if rabies exposure possible and animal status unknown");
      } else {
        add("T14.9",    "Injury, unspecified", "Use specific S-code for anatomical site");
        add("S01.319A", "Unspecified open wound of nose, initial encounter", "Example — replace with appropriate site-specific S code");
      }
      add("Z23",     "Encounter for inoculation and vaccination", "Use when tetanus prophylaxis administered");
      return suggestions;
    }

    /* ── Pressure Injury ─────────────────────────────────────── */
    if (c.pressureRelated) {
      let siteCode;
      if      (locHas("sacr","coccyx","tailbone","sacrococcygeal"))     siteCode = "15";
      else if (isRight && locHas("hip","trochant","femur neck"))        siteCode = "21";
      else if (isLeft  && locHas("hip","trochant","femur neck"))        siteCode = "22";
      else if (locHas("hip","trochant"))                                siteCode = "20";
      else if (isRight && locHas("buttock","ischial","ischium","sit bone")) siteCode = "31";
      else if (isLeft  && locHas("buttock","ischial","ischium","sit bone")) siteCode = "32";
      else if (locHas("buttock","ischial","sit bone"))                  siteCode = "30";
      else if (isRight && locHas("heel"))                               siteCode = "61";
      else if (isLeft  && locHas("heel"))                               siteCode = "62";
      else if (locHas("heel"))                                          siteCode = "60";
      else if (isRight && locHas("ankle","malleolus"))                  siteCode = "51";
      else if (isLeft  && locHas("ankle","malleolus"))                  siteCode = "52";
      else if (locHas("ankle","malleolus"))                             siteCode = "50";
      else if (isRight && locHas("elbow","olecranon"))                  siteCode = "01";
      else if (isLeft  && locHas("elbow","olecranon"))                  siteCode = "02";
      else if (locHas("elbow","olecranon"))                             siteCode = "00";
      else if (locHas("occiput","scalp","head","temple","ear"))         siteCode = "81";
      else if (isRight && locHas("upper back","thorac","scapul","shoulder blade")) siteCode = "11";
      else if (isLeft  && locHas("upper back","thorac","scapul","shoulder blade")) siteCode = "12";
      else if (isRight && locHas("lower back","lumbar","lumbosacral"))  siteCode = "13";
      else if (isLeft  && locHas("lower back","lumbar","lumbosacral"))  siteCode = "14";
      else if (locHas("back","spine","thorac","lumbar","vertebra"))     siteCode = "10";
      else                                                              siteCode = "89";

      const s = c.stageText;
      const stageDigit =
        s.includes("unstageable")         ? "0" :
        s.includes("stage 1") || s.includes("stage i ") ? "1" :
        s.includes("stage 2") || s.includes("stage ii")  ? "2" :
        s.includes("stage 3") || s.includes("stage iii") ? "3" :
        s.includes("stage 4") || s.includes("stage iv")  ? "4" :
        s.includes("deep tissue") || s.includes("dtpi") || s.includes("dti") ? "6" : "9";

      const siteLabels = {
        "00":"elbow unsp.","01":"right elbow","02":"left elbow",
        "10":"back unsp.","11":"right upper back","12":"left upper back",
        "13":"right lower back","14":"left lower back","15":"sacral region",
        "20":"hip unsp.","21":"right hip","22":"left hip",
        "30":"buttock unsp.","31":"right buttock","32":"left buttock",
        "50":"ankle unsp.","51":"right ankle","52":"left ankle",
        "60":"heel unsp.","61":"right heel","62":"left heel",
        "81":"head","89":"other/unspecified site",
      };
      const stageLabels = { "0":"unstageable","1":"stage 1","2":"stage 2","3":"stage 3","4":"stage 4","6":"deep tissue","9":"unsp. stage" };
      add(`L89.${siteCode}${stageDigit}`, `Pressure injury, ${siteLabels[siteCode] || "other"}, ${stageLabels[stageDigit]}`);
      if (c.potentialBioburden || c.effectiveInfectionSigns?.length) {
        const cellSite = locHas("leg","foot","ankle","heel") ? "L03.116" : locHas("sacr","buttock","hip") ? "L03.316" : "L03.90";
        add(cellSite, "Cellulitis of wound site", "Add if clinical infection/cellulitis present");
      }
      if (c.osteomyelitisSignal) add("M86.9", "Osteomyelitis, unspecified", "Confirm with imaging/biopsy; specify site when known");
      return suggestions;
    }

    /* ── MASD / IAD ──────────────────────────────────────────── */
    if (c.masdRelated) {
      add("L22",   "Diaper dermatitis / incontinence-associated dermatitis");
      add("L30.4", "Erythema intertrigo", "For intertriginous MASD");
      add("L30.3", "Infective dermatitis", "Add if secondary fungal infection confirmed (+ B37.2 candidiasis)");
      return suggestions;
    }

    /* ── Skin Tear ────────────────────────────────────────────── */
    if (c.skinTear) {
      const skinTearBase =
        locHas("head","scalp","face","forehead")    ? "S00.819A" :
        locHas("neck")                              ? "S10.919A" :
        locHas("shoulder","upper arm")              ? "S40.819A" :
        locHas("forearm","lower arm")               ? "S50.819A" :
        locHas("wrist","hand","finger")             ? "S60.919A" :
        locHas("thigh","upper leg")                 ? "S70.919A" :
        locHas("knee")                              ? "S80.019A" :
        locHas("lower leg","shin","calf")           ? "S80.819A" :
        locHas("ankle","foot","toe")                ? "S90.919A" :
        locHas("chest","thorax","trunk","abdomen")  ? "S20.319A" :
        locHas("back","lumbar")                     ? "S30.819A" :
        "S00.819A";
      add(skinTearBase, "Superficial injury / skin tear (initial encounter)", "Replace 7th character: A=initial, D=subsequent, S=sequela; verify site code matches exact location");
      if (c.staleInfo || c.chronic) add("L98.499", "Non-pressure chronic ulcer, unspecified", "Use if skin tear is non-healing > 30 days");
      return suggestions;
    }

    /* ── Burns ───────────────────────────────────────────────── */
    if (c.burnWound) {
      const isRadBurn = c.radiationWound;
      if (isRadBurn) {
        add("L58.9", "Radiodermatitis, unspecified", "For radiation-related burn/skin damage");
        return suggestions;
      }
      const burnClass = normalizeText(row.stage || "");
      const degreeDigit =
        burnClass.includes("full") || burnClass.includes("3rd") || burnClass.includes("third")      ? "3" :
        burnClass.includes("partial") || burnClass.includes("2nd") || burnClass.includes("second")   ? "2" :
        burnClass.includes("superficial") || burnClass.includes("1st") || burnClass.includes("first") ? "1" : "0";

      const burnSiteCode =
        locHas("head","face","scalp","forehead","chin") ? `T20.${degreeDigit}` :
        locHas("neck","throat")                         ? `T20.${degreeDigit}` :
        locHas("chest","trunk","thorax","abdomen","back","buttock") ? `T21.${degreeDigit}` :
        locHas("shoulder","upper arm")                  ? `T22.${degreeDigit}9` :
        locHas("forearm","elbow")                       ? `T22.${degreeDigit}9` :
        locHas("wrist","hand","palm","fingers")          ? `T23.${degreeDigit}92` :
        locHas("thigh","upper leg")                     ? `T24.${degreeDigit}91` :
        locHas("lower leg","calf","shin","knee")         ? `T24.${degreeDigit}91` :
        locHas("ankle","foot","toes")                    ? `T25.${degreeDigit}91` :
        `T30.${degreeDigit}`;
      const degreeLabels = {"0":"unsp. degree","1":"superficial (1st)","2":"partial thickness (2nd)","3":"full thickness (3rd)"};
      add(burnSiteCode + "A", `Burn — ${degreeLabels[degreeDigit]}; initial encounter`, "Add A=initial, D=subsequent, S=sequela; verify specific site code");
      if (degreeDigit === "3") add("T31.0", "Burns < 10% TBSA", "Add T31.xx for documentation of % body surface area involved");
      return suggestions;
    }

    /* ── Diabetic Foot Ulcer ─────────────────────────────────── */
    if (c.diabeticFootRelated) {
      const dmCode = c.woundTypeText.includes("type 1") ? "E10.621" : "E11.621";
      add(dmCode, `${dmCode === "E10.621" ? "Type 1" : "Type 2"} DM with foot ulcer`, "Verify DM type; add E11.65 if uncontrolled hyperglycemia");

      const l97Site =
        locHas("toe","digit","hallux","metatarsal","1st toe","great toe","first toe") ? `L97.5${side}9` :
        locHas("ankle","malleolus","gaiter","perimalleolar")                ? `L97.2${side}9` :
        locHas("plantar","midfoot","arch","sole")                           ? `L97.3${side}9` :
        locHas("heel")                                                      ? `L97.4${side}9` :
        locHas("calf","lower leg","shin","tibia","pretibial")               ? `L97.1${side}9` :
        locHas("foot","dorsum")                                             ? `L97.5${side}9` :
        locHas("leg","lower extremity","extremity")                         ? `L97.4${side}9` :
                                                                              `L97.4${side}9`;
      const l97Labels = {
        [`L97.119`]:"right calf", [`L97.129`]:"left calf", [`L97.199`]:"unsp. calf",
        [`L97.219`]:"right ankle",[`L97.229`]:"left ankle",[`L97.299`]:"unsp. ankle",
        [`L97.319`]:"right plantar/midfoot",[`L97.329`]:"left plantar/midfoot",[`L97.399`]:"unsp. plantar",
        [`L97.419`]:"right heel/midfoot",[`L97.429`]:"left heel/midfoot",[`L97.499`]:"unsp. heel",
        [`L97.519`]:"right toe/forefoot",[`L97.529`]:"left toe/forefoot",[`L97.599`]:"unsp. toe",
      };
      add(l97Site, `Non-pressure chronic ulcer, ${l97Labels[l97Site] || "foot/lower leg"}, unspecified severity`);

      if (c.potentialBioburden || c.effectiveInfectionSigns?.length) {
        add("L03.116", "Cellulitis of right lower limb", "Use L03.126 for left; L03.116/126 for leg; L03.89 for foot/toe");
      }
      if (c.osteomyelitisSignal) {
        add(isRight ? "M86.171" : isLeft ? "M86.172" : "M86.179",
          `Osteomyelitis, ${isRight ? "right" : isLeft ? "left" : "unspecified"} ankle and foot`, "Confirm with MRI and bone biopsy");
      }
      return suggestions;
    }

    /* ── Venous Leg Ulcer ────────────────────────────────────── */
    if (c.venousRelated && !c.arterialRelated) {
      const site5 =
        locHas("thigh","femur")                                               ? "1" :
        locHas("ankle","malleolus","gaiter","perimalleolar")                  ? "3" :
        locHas("calf","lower leg","shin","pretibial","tibia")                 ? "2" :
        locHas("heel","midfoot","plantar","arch","sole")                      ? "4" :
        locHas("foot","toe","hallux","dorsum","metatarsal")                   ? "5" :
        locHas("leg","lower extremity","extremity")                           ? "8" : "9";
      const lat = isRight ? "1" : isLeft ? "2" : "0";
      const site5Labels = {
        "1":"thigh","2":"calf / lower leg","3":"ankle",
        "4":"heel and midfoot","5":"foot / toe",
        "8":"other part of lower leg","9":"unspecified part",
      };
      add(`I83.0${lat}${site5}`,
        `Varicose veins, ${isRight ? "right" : isLeft ? "left" : "unspecified"} lower extremity — ulcer of ${site5Labels[site5] || "lower leg"}`);
      add(`I87.31${side}`,
        `Chronic venous hypertension with ulcer, ${isRight ? "right" : isLeft ? "left" : "unspecified"} leg`,
        "Use instead of I83.0xx for non-varicose CVI");
      if (c.potentialBioburden || c.effectiveInfectionSigns?.length) {
        add(isRight ? "L03.116" : isLeft ? "L03.126" : "L03.116",
          `Cellulitis of ${isRight ? "right" : isLeft ? "left" : "lower"} limb`, "Add if cellulitis present");
      }
      return suggestions;
    }

    /* ── Arterial / Ischemic ─────────────────────────────────── */
    if (c.arterialRelated) {
      const artSite =
        locHas("thigh","femur","upper leg")                                   ? "3" :
        locHas("ankle","malleolus","gaiter","perimalleolar")                  ? "5" :
        locHas("calf","lower leg","shin","tibia","pretibial")                 ? "4" :
        locHas("heel","midfoot","plantar","arch","sole")                      ? "6" :
        locHas("foot","toe","hallux","dorsum","metatarsal")                   ? "7" :
        locHas("leg","lower extremity","extremity")                           ? "9" : "9";
      const artSiteLabels = {
        "3":"thigh","4":"calf","5":"ankle",
        "6":"heel and midfoot","7":"other part of foot","9":"lower leg / other",
      };
      const lat2 = isRight ? "1" : isLeft ? "2" : "9";
      add(`I70.${artSite}${lat2}`,
        `Atherosclerosis, native arteries, ${isRight ? "right" : isLeft ? "left" : "unspecified"} leg — ulceration of ${artSiteLabels[artSite] || "lower extremity"}`);
      if (c.venousRelated) {
        add(`I70.${artSite}3${lat2}`,
          "Atherosclerosis of bypass graft with ulceration", "Use if bypass graft (not native artery)");
      }
      add("I73.9", "Peripheral vascular disease, unspecified", "Secondary code for PAD documentation");
      return suggestions;
    }

    /* ── Radiation Wound ─────────────────────────────────────── */
    if (c.radiationWound) {
      add("L58.9",  "Radiodermatitis, unspecified");
      add("L58.1",  "Chronic radiodermatitis", "Use for delayed/chronic radiation wound");
      add("M27.2",  "Inflammatory conditions of jaws — osteoradionecrosis", "If mandibular ORN");
      add("M90.80", "Osteopathy in other diseases classified elsewhere", "For radiation-induced bone pathology elsewhere");
      return suggestions;
    }

    /* ── Vasculitic Ulcer ───────────────────────────────────────── */
    if (c.vasculiticUlcer) {
      add("L95.9",  "Vasculitis limited to the skin, unspecified");
      add("L95.8",  "Other vasculitis limited to the skin", "Use for specific named vasculitis with skin ulceration");
      add("M31.30", "Wegener granulomatosis (GPA), unspecified", "Replace with M31.31 with lung involvement, or M05.xx if RA-associated vasculitis");
      add("D89.1",  "Cryoglobulinemia", "Add if cryoglobulinemic vasculitis confirmed");
      add("L98.499","Non-pressure chronic ulcer, unspecified severity", "Use as primary wound code alongside vasculitis code");
      return suggestions;
    }

    /* ── Martorell Ulcer (HILU) ──────────────────────────────── */
    if (c.martorell) {
      add("I10",    "Essential (primary) hypertension", "Primary driver of Martorell / HILU; document hypertension explicitly");
      add("L97.899","Non-pressure chronic ulcer of other part of lower leg, unspecified severity", "For lateral leg HILU ulcer; adjust laterality and site as appropriate");
      add("I77.1",  "Stricture of artery", "Use for arteriolar calcification/occlusion driving ischemia");
      add("M61.50", "Ossification and calcification of muscle, unspecified", "Consider for Monckeberg medial calcific sclerosis component");
      return suggestions;
    }

    /* ── Hidradenitis Suppurativa ────────────────────────────── */
    if (c.hidradenitisSuppurativa) {
      add("L73.2",  "Hidradenitis suppurativa");
      if (c.stageText.includes("hurley stage i") || c.stageText.includes("hurley i")) {
        add("L73.2", "HS, Hurley Stage I", "Same code L73.2 — stage documented in clinical notes");
      }
      add("L02.90", "Cutaneous abscess, unspecified", "Add when acute abscess is present alongside chronic HS");
      add("L08.1",  "Erythrasma", "Distinguish from HS in intertriginous areas; HS is the primary code");
      add("Z87.39", "Personal history of other musculoskeletal disorders", "Add if prior surgical excisions documented");
      return suggestions;
    }

    /* ── Graft Wound ─────────────────────────────────────────── */
    if (c.graftWound) {
      const isDonorSite = c.woundTypeText.includes("donor");
      const isGraftFailure = c.woundTypeText.includes("failure") || c.stageText.includes("failure") || c.stageText.includes("failed");
      if (isDonorSite) {
        add("T79.8XXA","Other early complications of trauma — donor site, initial encounter", "Use with W-X cause code if trauma origin");
        add("L98.419", "Non-pressure chronic ulcer of skin not elsewhere classified, unspecified severity", "For non-healing donor site wound");
      } else if (isGraftFailure) {
        add("T86.821", "Failure of skin graft", "Primary code for failed STSG/FTSG");
        add("T86.828", "Other complications of skin graft", "Use for partial failure or infection of graft");
      } else {
        add("Z48.817","Encounter for surgical aftercare following surgery on the skin and subcutaneous tissue", "Routine post-graft follow-up");
        add("T86.820","Skin graft (partial/full) — unspecified complication", "If complication NOS");
      }
      return suggestions;
    }

    /* ── Osteomyelitis (standalone) ──────────────────────────── */
    if (c.osteomyelitisSignal) {
      const omSite =
        locHas("hand","wrist","finger")                                   ? (isRight ? "M86.141" : isLeft ? "M86.142" : "M86.149") :
        locHas("foot","toe","ankle","hallux","metatarsal","lower-leg","lower leg","tibia","fibula","leg","lower extremity") ?
          (isRight ? "M86.171" : isLeft ? "M86.172" : "M86.179") :
        locHas("thigh","femur","hip","pelvis")                            ? (isRight ? "M86.151" : isLeft ? "M86.152" : "M86.159") :
        locHas("shoulder","humerus","upper arm")                         ? (isRight ? "M86.111" : isLeft ? "M86.112" : "M86.119") :
        locHas("forearm","radius","ulna","elbow")                        ? (isRight ? "M86.131" : isLeft ? "M86.132" : "M86.139") :
        locHas("spine","vertebra","lumbar","thorac","cervical","sacral") ? "M86.18" :
        locHas("jaw","mandible","maxilla")                               ? "M27.3" :
        "M86.9";
      add(omSite, `Osteomyelitis — ${isRight ? "right" : isLeft ? "left" : "unspecified"} site`, "Confirm with imaging and bone biopsy; refine code when type/chronicity established");
      if (omSite !== "M86.9") add("M86.9", "Osteomyelitis, unspecified", "Use if site/type pending confirmation");
      return suggestions;
    }

    /* ── Surgical Wound ──────────────────────────────────────── */
    if (c.surgicalWound) {
      add("T81.31XA", "Disruption of external operation (wound dehiscence), initial encounter");
      add("T81.32XA", "Disruption of internal operation wound NEC, initial encounter", "Use if deep fascia/internal layer involved");
      add("T81.41XA", "Infection following a procedure, initial encounter");
      add("T81.42XA", "Infection following a procedure — deep incisional SSI, initial encounter");
      add("T81.49XA", "Other infection following procedure, initial encounter");
      if (c.woundTypeText.includes("sternal") || c.locationText.includes("sternum") || c.locationText.includes("chest")) {
        add("T81.31XA", "Sternal wound dehiscence — also see J98.19 or specific procedural complication codes");
      }
      return suggestions;
    }

    /* ── Fallback / General Chronic Ulcer ───────────────────── */
    const genSite =
      locHas("ankle","malleolus","gaiter","perimalleolar")          ? `L97.2${side}9` :
      locHas("calf","lower leg","shin","pretibial","tibia")          ? `L97.1${side}9` :
      locHas("plantar","midfoot","arch","sole")                      ? `L97.3${side}9` :
      locHas("heel")                                                 ? `L97.4${side}9` :
      locHas("toe","hallux","metatarsal","digit")                    ? `L97.5${side}9` :
      locHas("thigh","femur","upper leg")                            ? `L97.1${side}9` :
      locHas("leg","lower extremity","extremity")                    ? `L97.8${side}9` :
      locHas("foot","dorsum","plantar")                              ? `L97.5${side}9` :
      locHas("back","lumbar","sacr","buttock","coccyx","ischial")    ? "L98.419"        :
      locHas("head","scalp","face","neck","occiput","ear","chin")    ? "L98.499"        :
      locHas("arm","forearm","elbow","wrist","hand","finger")        ? "L98.499"        :
      locHas("abdomen","trunk","chest","thorax","groin","perineal")  ? "L98.419"        : "L98.499";
    const genNote = locHas("leg","lower extremity","lower-leg","extremity") && !locHas("calf","ankle","heel","toe","foot","shin")
      ? "Consider more specific code when ulcer site within the leg is known (calf→L97.1, ankle→L97.2, heel→L97.4)"
      : "";
    add(genSite, "Non-pressure chronic ulcer — unspecified severity", genNote);
    return suggestions;
  }

  function buildCPTSuggestions(row) {
    const c = buildContext(row, null, row.manual_overrides || null);
    const loc = expandLocAbbreviations(c.locationText);
    const suggestions = [];
    const add = (code, description, note = "") => suggestions.push({ code, description, note });

    const area   = Number(row.area_cm2 || 0);
    const depth  = Number(row.depth_cm  || 0);
    const eschar = Number(row.eschar_pct || 0);
    const slough = Number(row.slough_pct || 0);
    const needsDebride = c.debridementNeeded || eschar > 0 || slough >= 20;

    /* ── NF emergency ──────────────────────────────────── */
    if (c.necrotizingFasciitis) {
      add("11043", "Debridement, muscle and/or fascia; first 20 sq cm", "Emergency surgical debridement; use 11046 for each additional 20 sq cm");
      add("11044", "Debridement, bone; first 20 sq cm", "If bone involvement; use 11047 for each additional 20 sq cm");
      add("99223", "Initial hospital care, high complexity", "Inpatient E&M for admission");
      return suggestions;
    }

    /* ── Burns ─────────────────────────────────────────── */
    if (c.burnWound) {
      add("16020", "Dressing and/or debridement, partial-thickness burns; small (< 5% TBSA)");
      add("16025", "Dressing and/or debridement; medium (5–10% TBSA or whole extremity)");
      add("16030", "Dressing and/or debridement; large (> 10% TBSA or > 1 extremity)");
      add("16035", "Escharotomy", "Use if circumferential burn with compartment risk");
      return suggestions;
    }

    /* ── Fistula ───────────────────────────────────────── */
    if (c.fistulaWound) {
      add("97602", "Non-selective wound debridement, per session", "For periwound skin management");
      add("44640", "Closure of intestinal cutaneous fistula", "Surgical; add E&M for management visits");
      add("99213", "Office/outpatient E&M visit, low-moderate complexity", "Wound management follow-up");
      return suggestions;
    }

    /* ── Surgical Wound / Dehiscence ──────────────────── */
    if (c.surgicalWound) {
      add("97597", "Active wound care management, selective debridement; first 20 sq cm");
      add("97598", "Active wound care management, selective debridement; each additional 20 sq cm");
      add("13160", "Secondary closure of surgical wound or dehiscence", "For delayed primary closure or secondary closure of dehisced incision");
      if (depth >= 1.0 || c.cavityLikely) {
        add("97605", "NPWT dressing change ≤ 50 sq cm", "For deep surgical wound dehiscence with cavity");
        add("97606", "NPWT dressing change > 50 sq cm");
      }
      add("99213", "Office/outpatient E&M, low-moderate complexity", "Wound management visit");
      return suggestions;
    }

    /* ── Osteomyelitis ─────────────────────────────────── */
    if (c.osteomyelitisWound && !c.pressureRelated && !c.diabeticFootRelated) {
      add("11044", "Debridement, bone; first 20 sq cm", "For bone debridement/sequestrectomy");
      add("11047", "Debridement, bone; each additional 20 sq cm");
      add("20220", "Biopsy, bone, trocar or needle; superficial", "For diagnostic bone biopsy; 20225 for deep");
      add("20245", "Biopsy, bone, open; deep", "When trocar/needle biopsy not possible or inconclusive");
      add("97605", "NPWT dressing change ≤ 50 sq cm", "For post-debridement wound management");
      add("99213", "Office/outpatient E&M, low-moderate complexity");
      return suggestions;
    }

    /* ── Vasculitic Ulcer ──────────────────────────────── */
    if (c.vasculiticUlcer) {
      add("97597", "Active wound care management, selective debridement; first 20 sq cm", "Only after specialist approves debridement");
      add("97602", "Non-selective wound debridement, per session", "Autolytic/enzymatic — conservative approach preferred");
      add("11100", "Biopsy of skin, subcutaneous tissue; single lesion", "Punch biopsy of wound edge for histopathology and DIF");
      add("99213", "Office/outpatient E&M, low-moderate complexity", "Wound management visit; primary billing should reflect rheumatology/dermatology management");
      return suggestions;
    }

    /* ── Martorell Ulcer (HILU) ────────────────────────── */
    if (c.martorell) {
      add("97597", "Active wound care management, selective debridement; first 20 sq cm", "Only after BP control established and pain adequately managed");
      add("99213", "Office/outpatient E&M, low-moderate complexity", "Wound management visit; hypertension management billed separately");
      if (c.radiationWound || depth >= 0.5) {
        add("99183", "Physician supervision of hyperbaric oxygen therapy, per session");
        add("G0277", "HBOT, full body; 30 minutes");
      }
      return suggestions;
    }

    /* ── Hidradenitis Suppurativa ───────────────────────── */
    if (c.hidradenitisSuppurativa) {
      const stage = c.stageText;
      if (stage.includes("hurley stage ii") || stage.includes("hurley ii") || stage.includes("hurley stage iii") || stage.includes("hurley iii")) {
        add("10060", "Incision and drainage of abscess; simple/single", "For acute abscess I&D (Hurley I-II)");
        add("10061", "Incision and drainage of abscess; complicated/multiple", "Multiple or complicated abscesses");
        add("11450", "Excision of skin and subcutaneous tissue for hidradenitis, axillary; with simple or intermediate closure", "Stage II-III deroofing or excision");
        add("11451", "Excision for hidradenitis, axillary; requiring complex closure", "Stage III wide excision");
        add("11462", "Excision for hidradenitis, inguinal; with simple or intermediate closure");
        add("11463", "Excision for hidradenitis, inguinal; requiring complex closure");
      } else {
        add("10060", "Incision and drainage of abscess; simple/single", "For acute abscess I&D (Hurley I)");
        add("11900", "Injection, intralesional; up to 7 lesions", "For intralesional triamcinolone");
      }
      add("97602", "Non-selective debridement, per session", "For draining sinus tracts wound care");
      add("99213", "Office/outpatient E&M, low-moderate complexity");
      return suggestions;
    }

    /* ── Graft Wound ───────────────────────────────────── */
    if (c.graftWound) {
      const stageVal = c.stageText;
      const isDonor = stageVal.includes("donor");
      const isFailed = stageVal.includes("failure") || stageVal.includes("failed");
      if (isDonor) {
        add("97597", "Active wound care management, selective debridement; first 20 sq cm", "Donor site wound management");
        add("99213", "Office/outpatient E&M, low-moderate complexity", "Donor site follow-up visit");
      } else if (isFailed) {
        add("15100", "Split-thickness autograft, trunk/arms/legs; first 100 sq cm or 1% TBSA in children", "Re-grafting procedure");
        add("15101", "Split-thickness autograft; each additional 100 sq cm");
        add("97605", "NPWT dressing change ≤ 50 sq cm", "For wound bed preparation pre-re-grafting");
        add("97606", "NPWT dressing change > 50 sq cm");
        add("97597", "Active wound care management, selective debridement; first 20 sq cm", "Failed graft debridement");
      } else {
        add("15002", "Surgical preparation/creation of recipient site; trunk/arms/legs first 100 sq cm", "Use for recipient site wound bed prep if needed");
        add("15100", "Split-thickness autograft, trunk/arms/legs; first 100 sq cm", "Initial grafting procedure");
        add("99213", "Office/outpatient E&M, low-moderate complexity", "Post-graft follow-up");
      }
      return suggestions;
    }

    /* ── Debridement — depth-tiered ────────────────────── */
    if (needsDebride) {
      const stageText = c.stageText;
      const isStage4 = stageText.includes("stage 4") || stageText.includes("stage iv");
      const isStage3 = stageText.includes("stage 3") || stageText.includes("stage iii");
      const fullThick = c.manualThickness === "full_thickness";

      if (c.osteomyelitisSignal || isStage4) {
        add("11044", "Debridement, bone; first 20 sq cm", "Use 11047 for each additional 20 sq cm");
        add("11043", "Debridement, muscle and/or fascia; first 20 sq cm", "Use 11046 each addl. 20 sq cm; bill separately if both tissue types debrided");
        add("20220", "Biopsy, bone, trocar or needle; superficial", "For osteomyelitis culture — required for definitive diagnosis");
      } else if (isStage3 || fullThick || depth >= 0.5) {
        add("11043", "Debridement, muscle and/or fascia; first 20 sq cm");
        add("11046", "Debridement, muscle and/or fascia; each additional 20 sq cm");
        add("97597", "Active wound care management, selective debridement; first 20 sq cm", "May be used instead of 11043 — verify payer preference");
      } else {
        add("11042", "Debridement, subcutaneous tissue; first 20 sq cm");
        add("11045", "Debridement, subcutaneous tissue; each additional 20 sq cm");
        add("97597", "Active wound care management, selective debridement; first 20 sq cm");
        add("97598", "Active wound care management, debridement; each additional 20 sq cm");
      }
    }

    /* ── Non-selective debridement ─────────────────────── */
    if (slough >= 30 && !needsDebride) {
      add("97602", "Non-selective debridement (enzymatic, autolytic, wet-to-dry), per session");
    }

    /* ── NPWT ──────────────────────────────────────────── */
    if (c.osteomyelitisSignal || depth >= 1.0 || (c.cavityLikely && area >= 5)) {
      add("97605", "Negative pressure wound therapy (NPWT) dressing change ≤ 50 sq cm, per session");
      add("97606", "NPWT dressing change > 50 sq cm, per session");
      add("97607", "NPWT using durable medical equipment ≤ 50 sq cm", "Bill 97607/97608 when patient owns or rents the pump");
      add("97608", "NPWT using durable medical equipment > 50 sq cm");
    }

    /* ── Compression ───────────────────────────────────── */
    if (c.venousRelated && !c.arterialRelated && !c.abiInadequateForCompression) {
      add("29580", "Strapping; Unna boot");
      add("29581", "Application of multi-layer compression system; leg (below knee)");
      add("29582", "Application of multi-layer compression system; thigh and leg");
    }

    /* ── Skin substitute (CTP) — stalled wounds ────────── */
    if ((c.diabeticSuboptimal4WeekProgress || c.venousSuboptimal4WeekProgress) || (c.stalled && area > 0 && needsDebride === false)) {
      add("15271", "Application of skin substitute graft, trunk/arms/legs; first 25 sq cm or less");
      add("15272", "Application of skin substitute graft; each additional 25 sq cm (add-on to 15271)");
      add("Q4100–Q4299", "Skin substitute product HCPCS Q-code", "Bill the appropriate Q-code for the specific CTP product applied");
    }

    /* ── HBOT ──────────────────────────────────────────── */
    if (c.radiationWound || c.martorell || (c.diabeticFootRelated && c.osteomyelitisSignal) || (c.osteomyelitisWound && c.chronic)) {
      add("99183", "Physician or other QHP supervision of hyperbaric oxygen therapy, per session");
      add("G0277", "HBOT, pressure, full body; 30 minutes", "Facility code; 99183 is professional component");
    }

    /* ── Wound care visit E&M fallback ─────────────────── */
    if (!suggestions.length) {
      add("97597", "Active wound care management, selective debridement; first 20 sq cm");
      add("97602", "Non-selective debridement, per session");
    }

    return suggestions;
  }


  function buildPUSHScore(row) {
    const c = buildContext(row, null, row.manual_overrides || null);
    if (!c.pressureRelated) return null;

    /* ── Subscore 1: Surface Area (L × W in cm²) ── */
    const area = Number(row.area_cm2 || 0);
    const hasArea = area > 0;
    const areaScore =
      !hasArea        ? null :
      area === 0      ? 0 :
      area < 0.3      ? 1 :
      area <= 0.6     ? 2 :
      area <= 1.0     ? 3 :
      area <= 2.0     ? 4 :
      area <= 3.0     ? 5 :
      area <= 4.0     ? 6 :
      area <= 8.0     ? 7 :
      area <= 12.0    ? 8 :
      area <= 24.0    ? 9 : 10;

    /* ── Subscore 2: Exudate Amount ──────────────────────────────────
       detailed row stores effective_exudate_amount (raw value like
       "scant","moderate","large") or exudate_amount_text (label text) */
    const exudateRaw = normalizeText(
      row.effective_exudate_amount ||
      row.exudate_amount_text ||
      row.exudate_amount || ""
    );
    const exudateScore =
      !exudateRaw ? null :
      exudateRaw === "none" || exudateRaw === "nil" || exudateRaw === "dry" ? 0 :
      exudateRaw.includes("scant") || exudateRaw.includes("small") || exudateRaw.includes("light") || exudateRaw.includes("trace") || exudateRaw.includes("minimal") ? 1 :
      exudateRaw.includes("mod") ? 2 :
      exudateRaw.includes("larg") || exudateRaw.includes("heavy") || exudateRaw.includes("copio") ? 3 : null;

    /* ── Subscore 3: Tissue Type ─────────────────────────────────────
       detailed row uses _mid suffix; fallback to plain for flexibility */
    const eschar  = Number(row.eschar_pct_mid  ?? row.eschar_pct  ?? 0);
    const slough  = Number(row.slough_pct_mid  ?? row.slough_pct  ?? 0);
    const gran    = Number(row.granulation_pct_mid  ?? row.granulation_pct  ?? 0);
    const epi     = Number(row.epithelialization_pct_mid ?? row.epithelialization_pct ?? 0);
    const status  = normalizeText(row.status || "");
    const hasTissue = eschar > 0 || slough > 0 || gran > 0 || epi > 0 || Boolean(status);

    /* Exact match only — "Not Healed" contains "healed" so .includes() would give wrong result */
    const isWoundClosed =
      status === "healed" ||
      status === "closed" ||
      status === "wound closed" ||
      status === "resolved" ||
      status === "healed - closed" ||
      /\bresolv(ed)?\b/.test(status);

    const tissueScore =
      !hasTissue    ? null :
      isWoundClosed ? 0 :
      eschar > 0    ? 4 :
      slough > 0    ? 3 :
      gran   > 0    ? 2 :
      epi    > 0    ? 1 : null;

    const tissueLabels = { 0: "Closed / healed", 1: "Epithelial tissue", 2: "Granulation tissue", 3: "Slough", 4: "Necrotic tissue (eschar)" };
    const exudateLabels = { 0: "None", 1: "Light", 2: "Moderate", 3: "Heavy" };

    const subscores = [
      {
        label: "Surface Area",
        value: areaScore,
        max: 10,
        detail: hasArea ? `${area.toFixed(1)} cm²` : "Area not entered",
      },
      {
        label: "Exudate Amount",
        value: exudateScore,
        max: 3,
        detail: exudateScore != null ? exudateLabels[exudateScore] : "Not documented",
      },
      {
        label: "Tissue Type",
        value: tissueScore,
        max: 4,
        detail: tissueScore != null ? tissueLabels[tissueScore] : "Not documented",
      },
    ];

    const allScored  = subscores.every((s) => s.value != null);
    const anyScored  = subscores.some((s) => s.value != null);
    const total      = allScored ? subscores.reduce((sum, s) => sum + s.value, 0) : null;

    return { subscores, total, allScored, anyScored };
  }

  function renderPUSHScoreHtml(push) {
    if (!push || !push.anyScored) return "";

    const totalStr = push.total != null
      ? `<span class="push-total">${push.total}</span><span class="push-max"> / 17</span>`
      : `<span class="push-total push-partial">—</span><span class="push-max"> / 17 (incomplete)</span>`;

    const interpretation = push.total == null ? "" :
      push.total === 0 ? "Score 0 — wound closed or healed" :
      push.total <= 4  ? "Score 1–4 — minimal wound, monitor for full closure" :
      push.total <= 9  ? "Score 5–9 — moderate wound burden, continue active treatment" :
      push.total <= 13 ? "Score 10–13 — significant wound, intensify treatment and reassess plan" :
                         "Score 14–17 — severe wound, aggressive intervention warranted";

    const rows = push.subscores.map((s) => {
      const score = s.value != null ? s.value : "—";
      const pct = s.value != null ? Math.round((s.value / s.max) * 100) : 0;
      return `
        <tr class="push-row">
          <td class="push-label">${escapeHtml(s.label)}</td>
          <td class="push-detail">${escapeHtml(s.detail)}</td>
          <td class="push-score-cell">
            <span class="push-chip">${score}/${s.max}</span>
            <div class="push-bar-bg"><div class="push-bar-fill" style="width:${pct}%"></div></div>
          </td>
        </tr>`;
    }).join("");

    return `
      <div class="push-block">
        <div class="push-header">
          <span class="push-title">PUSH Score</span>
          <div class="push-total-row">${totalStr}</div>
        </div>
        <table class="push-table">${rows}</table>
        ${interpretation ? `<p class="push-interpretation">${escapeHtml(interpretation)}</p>` : ""}
        <p class="push-note">PUSH Tool © National Pressure Injury Advisory Panel (NPIAP). Decrease over time = healing trajectory.</p>
      </div>`;
  }

  function buildChartNarrative(rows, style = "detailed") {
    if (!rows.length) {
      return '<p class="narrative-empty">No wound entries were generated yet.</p>';
    }

    const patientGroups = new Map();
    for (const row of rows) {
      const patientName = normalizePersonName(String(row.name || "Unknown patient").trim()) || "Unknown patient";
      const patientMrn = String(row.mrn || "").trim();
      const patientKey = `${patientName}|${patientMrn}`;
      if (!patientGroups.has(patientKey)) patientGroups.set(patientKey, { patientName, patientMrn, wounds: [] });
      patientGroups.get(patientKey).wounds.push(row);
    }

    const orderedPatients = Array.from(patientGroups.values());

    const patientBlocks = orderedPatients.map((patient) => {
      const woundCount = patient.wounds.length;
      const intro = woundCount === 1
        ? fillTemplate(getNarrativePhrase("intro_single"), { patient_name: patient.patientName, wound_count: "1" })
        : fillTemplate(getNarrativePhrase("intro_multi"), { patient_name: patient.patientName, wound_count: String(woundCount) });
      const woundText = patient.wounds
        .map((row) => buildWoundNarrativeSegment(row, style))
        .join(" ");
      const fullNarrative = `${intro} ${woundText}`.replace(/\s+/g, " ").trim();

      const icd10Blocks = patient.wounds.map((row) => {
        const icd10 = buildICD10Suggestions(row);
        const cpts  = buildCPTSuggestions(row);
        if (!icd10.length && !cpts.length) return "";
        const woundLabel = [row.wound_type, row.location].filter(Boolean).join(" — ");

        const renderCodeList = (codes, heading, chipClass) => {
          if (!codes.length) return "";
          const rows = codes.map((c2) =>
            `<tr class="code-row">
              <td><span class="code-chip ${chipClass}">${escapeHtml(c2.code)}</span></td>
              <td class="code-desc">${escapeHtml(c2.description)}${c2.note ? `<br><em class="code-note">${escapeHtml(c2.note)}</em>` : ""}</td>
            </tr>`
          ).join("");
          return `<thead><tr><th colspan="2" class="code-type-header">${escapeHtml(heading)}</th></tr></thead><tbody>${rows}</tbody>`;
        };

        const tableContent = renderCodeList(icd10, "ICD-10 Diagnosis Codes", "chip-icd10") + renderCodeList(cpts, "CPT Procedure Codes", "chip-cpt");

        return `
          <details class="coding-section">
            <summary class="coding-toggle">
              <span class="coding-toggle-label">Suggested Codes</span>
              <span class="coding-toggle-meta">${escapeHtml(woundLabel || "Wound")} &middot; ${icd10.length} ICD-10 &middot; ${cpts.length} CPT</span>
            </summary>
            <table class="code-table">${tableContent}</table>
          </details>`;
      }).filter(Boolean).join("");

      const pushBlocks = patient.wounds
        .map((row) => renderPUSHScoreHtml(buildPUSHScore(row)))
        .filter(Boolean)
        .join("");

      return `
        <section class="narrative-patient">
          <div class="narrative-patient-header">
            <strong>${escapeHtml(patient.patientName)}</strong>
            <button class="copy-narrative-btn" type="button" data-narrative="${escapeHtml(fullNarrative)}" title="Copy narrative to clipboard">Copy Narrative</button>
          </div>
          <p class="narrative-summary">${escapeHtml(fullNarrative)}</p>
          ${pushBlocks}
          ${icd10Blocks || ""}
        </section>
      `;
    });

    return patientBlocks.join("");
  }

  function defaultHistory() {
    return { version: 1, facilities: {} };
  }

  function loadHistory() {
    return defaultHistory();
  }

  function saveHistory(_data) {
    /* No-op: patient data is never persisted to localStorage. */
  }

  function buildReportId(meta, generatedIso) {
    const start = toIsoDate(meta.report_start_date);
    const end = toIsoDate(meta.report_end_date);
    if (start && end) return `${start}_to_${end}`;
    if (end) return end;
    return `generated_${generatedIso.replaceAll(":", "-").replace("T", "_").replace("Z", "")}`;
  }

  function buildSnapshot(rows, meta, reportId, generatedIso) {
    const wounds = {};
    const wound_timelines = {};
    const reportEndIso = toIsoDate(meta.report_end_date);
    for (const row of rows) {
      const key = buildWoundSnapshotKey(row);
      wounds[key] = {
        name: row.name,
        mrn: row.mrn,
        wound_type: row.wound_type || "",
        wound_number: row.wound_number,
        location: row.location,
        assessment_date: row.assessment_date,
        stage: row.stage,
        status: row.status,
        area_cm2: row.area_cm2,
        depth_cm: row.depth_cm,
        slough_pct_mid: row.slough_pct_mid,
        eschar_pct_mid: row.eschar_pct_mid,
        granulation_pct_mid: row.granulation_pct_mid,
        supplies_to_consider: row.supplies_to_consider,
        treatment_categories: row.treatment_categories,
      };

      const recordPoints = [];
      const sourceRecords = (Array.isArray(row?._wound_records_source) && row._wound_records_source.length)
        ? row._wound_records_source
        : [row];
      for (const sourceRecord of sourceRecords) {
        const point = buildTimelinePointFromRecordLike(sourceRecord, {
          source_report_id: reportId,
          source_report_end_date: reportEndIso,
          source_generated_at: generatedIso,
        });
        if (point) recordPoints.push(point);
      }
      if (!recordPoints.length) {
        const fallbackPoint = buildTimelinePointFromRecordLike(row, {
          source_report_id: reportId,
          source_report_end_date: reportEndIso,
          source_generated_at: generatedIso,
        });
        if (fallbackPoint) recordPoints.push(fallbackPoint);
      }
      wound_timelines[key] = {
        name: row.name,
        mrn: row.mrn,
        wound_type: row.wound_type || "",
        wound_number: row.wound_number,
        location: row.location,
        points: dedupeSortTimelinePoints(recordPoints),
      };
    }

    return {
      report_id: reportId,
      generated_at: generatedIso,
      facility: meta.facility,
      report_start_date: toIsoDate(meta.report_start_date),
      report_end_date: toIsoDate(meta.report_end_date),
      wound_count: rows.length,
      wounds,
      wound_timelines,
    };
  }

  function compareReportEntriesByDate(a, b) {
    const aEnd = String(a?.report_end_date || "");
    const bEnd = String(b?.report_end_date || "");
    if (aEnd !== bEnd) return aEnd.localeCompare(bEnd);
    return String(a?.generated_at || "").localeCompare(String(b?.generated_at || ""));
  }

  function pickPriorEntry(reports, currentReportId, currentEndDateIso) {
    const candidates = reports.filter((r) => r.report_id !== currentReportId);
    if (!candidates.length) return null;

    const getEnd = (x) => x.report_end_date || "";

    if (currentEndDateIso) {
      const older = candidates.filter((r) => getEnd(r) && getEnd(r) < currentEndDateIso).sort(compareReportEntriesByDate);
      return older.length ? older[older.length - 1] : null;
    }

    candidates.sort(compareReportEntriesByDate);
    return candidates[candidates.length - 1] || null;
  }

  function classifyTreatmentEffectWithTimeline(currentRow, priorRow, timelinePoints = []) {
    if (!priorRow) {
      return ["No prior wound match", "No earlier assessment point available for this wound history."];
    }
    const [immediateSignal, immediateWhy] = classifyTreatmentEffect(currentRow, priorRow);
    return [immediateSignal, immediateWhy || "No major directional change detected from available fields."];
  }

  function applyPriorComparison(rows, historicalSnapshots = [], priorSnapshot = null) {
    const priorEndFallback = priorSnapshot ? priorSnapshot.report_end_date || "" : "";

    for (const row of rows) {
      const timelineAll = Array.isArray(row?._timeline_points_source)
        ? dedupeSortTimelinePoints(row._timeline_points_source)
        : [];
      const currentIdxFromRow = Number.isInteger(row?._timeline_current_index) ? row._timeline_current_index : findCurrentTimelineIndex(timelineAll, row);
      const currentIdx = (currentIdxFromRow >= 0 && currentIdxFromRow < timelineAll.length)
        ? currentIdxFromRow
        : (timelineAll.length ? timelineAll.length - 1 : -1);
      const timeline = currentIdx >= 0 ? timelineAll.slice(0, currentIdx + 1) : timelineAll;

      row.timeline_points_used = timeline.length || "";
      row.timeline_start_date = timeline.length ? timeline[0].assessment_date : "";
      row.timeline_end_date = timeline.length ? timeline[timeline.length - 1].assessment_date : "";
      if (timeline.length >= 2) {
        const startDate = parseDate(timeline[0].assessment_date);
        const endDate = parseDate(timeline[timeline.length - 1].assessment_date);
        row.timeline_span_days = (startDate && endDate) ? Math.max(0, dateDiffDays(new Date(endDate), new Date(startDate))) : "";
      } else {
        row.timeline_span_days = "";
      }

      const priorPoint = timeline.length > 1 ? timeline[timeline.length - 2] : null;
      if (!priorPoint) {
        row.prior_report_end_date = "";
        row.prior_assessment_date = "";
        row.prior_area_cm2 = "";
        row.prior_depth_cm = "";
        row.prior_slough_pct_mid = "";
        row.prior_granulation_pct_mid = "";
        row.area_change_cm2_since_prior_report = "";
        row.area_change_pct_since_prior_report = "";
        row.depth_change_cm_since_prior_report = "";
        row.slough_change_pts_since_prior_report = "";
        row.granulation_change_pts_since_prior_report = "";
        row.status_change_since_prior_report = "";
        row.treatment_effect_signal = "No prior wound match";
        row.treatment_effect_rationale = "No earlier assessment point available for this wound history.";
        row.area_change_cm2_since_first_timeline = "";
        row.area_change_pct_since_first_timeline = "";
        row.depth_change_cm_since_first_timeline = "";
        continue;
      }

      const prior = toRecordLikeFromTimelinePoint(priorPoint, row);

      row.prior_report_end_date = priorPoint.source_report_end_date || priorEndFallback;
      row.prior_assessment_date = priorPoint.assessment_date || "";
      row.prior_area_cm2 = priorPoint.area_cm2 ?? "";
      row.prior_depth_cm = priorPoint.depth_cm ?? "";
      row.prior_slough_pct_mid = priorPoint.slough_pct_mid ?? "";
      row.prior_granulation_pct_mid = priorPoint.granulation_pct_mid ?? "";

      const cArea = Number(row.area_cm2);
      const pArea = Number(priorPoint.area_cm2);
      const cDepth = Number(row.depth_cm);
      const pDepth = Number(priorPoint.depth_cm);
      const cSl = Number(row.slough_pct_mid);
      const pSl = Number(priorPoint.slough_pct_mid);
      const cGr = Number(row.granulation_pct_mid);
      const pGr = Number(priorPoint.granulation_pct_mid);

      if (Number.isFinite(cArea) && Number.isFinite(pArea)) {
        const delta = cArea - pArea;
        row.area_change_cm2_since_prior_report = Number(delta.toFixed(2));
        row.area_change_pct_since_prior_report = pArea > 0 ? Number((((cArea - pArea) / pArea) * 100).toFixed(2)) : "";
      } else {
        row.area_change_cm2_since_prior_report = "";
        row.area_change_pct_since_prior_report = "";
      }

      row.depth_change_cm_since_prior_report = Number.isFinite(cDepth) && Number.isFinite(pDepth) ? Number((cDepth - pDepth).toFixed(2)) : "";
      row.slough_change_pts_since_prior_report = Number.isFinite(cSl) && Number.isFinite(pSl) ? Number((cSl - pSl).toFixed(1)) : "";
      row.granulation_change_pts_since_prior_report = Number.isFinite(cGr) && Number.isFinite(pGr) ? Number((cGr - pGr).toFixed(1)) : "";

      const priorStatus = String(prior.status || "").trim();
      const currentStatus = String(row.status || "").trim();
      row.status_change_since_prior_report = priorStatus || currentStatus ? `${priorStatus} -> ${currentStatus}` : "";

      const firstPoint = timeline.length ? timeline[0] : null;
      const firstArea = Number(firstPoint?.area_cm2);
      const firstDepth = Number(firstPoint?.depth_cm);
      if (Number.isFinite(cArea) && Number.isFinite(firstArea)) {
        const firstDelta = cArea - firstArea;
        row.area_change_cm2_since_first_timeline = Number(firstDelta.toFixed(2));
        row.area_change_pct_since_first_timeline = firstArea > 0 ? Number((((cArea - firstArea) / firstArea) * 100).toFixed(2)) : "";
      } else {
        row.area_change_cm2_since_first_timeline = "";
        row.area_change_pct_since_first_timeline = "";
      }
      row.depth_change_cm_since_first_timeline = Number.isFinite(cDepth) && Number.isFinite(firstDepth)
        ? Number((cDepth - firstDepth).toFixed(2))
        : "";

      const [sig, why] = classifyTreatmentEffectWithTimeline(row, prior, timeline);
      row.treatment_effect_signal = sig;
      row.treatment_effect_rationale = why;
    }
  }

  function saveSnapshotLocal(meta, rows, reportId, generatedIso) {
    const snapshot = buildSnapshot(rows, meta, reportId, generatedIso);
    if (!shouldPersistLocalHistory()) return snapshot;
    const policy = normalizeHipaaPolicy(hipaaPolicy || loadHipaaPolicyLocal());
    hipaaPolicy = policy;

    const history = loadHistory();
    const facilitySlug = slugify(meta.facility);
    if (!history.facilities[facilitySlug]) {
      history.facilities[facilitySlug] = { facility: meta.facility, reports: [], snapshots: {} };
    }

    const facility = history.facilities[facilitySlug];
    facility.facility = meta.facility;

    facility.snapshots[reportId] = snapshot;

    const rec = {
      report_id: reportId,
      report_start_date: toIsoDate(meta.report_start_date),
      report_end_date: toIsoDate(meta.report_end_date),
      generated_at: generatedIso,
    };

    const idx = facility.reports.findIndex((x) => x.report_id === reportId);
    if (idx >= 0) facility.reports[idx] = rec;
    else facility.reports.push(rec);

    saveHistory(history);
    appendLocalAuditEntry("snapshot_saved", {
      facility: meta.facility,
      report_id: reportId,
      report_end_date: rec.report_end_date || "",
      wound_count: rows.length,
    }, "local");
    if (policy.auto_purge_enabled) {
      purgeLocalHistoryByPolicy(policy, "auto_purge");
    }
    return snapshot;
  }

  function loadPriorSnapshotLocal(meta, currentReportId) {
    if (!shouldPersistLocalHistory()) return null;
    const history = loadHistory();
    const facility = history.facilities[slugify(meta.facility)];
    if (!facility || !Array.isArray(facility.reports)) return null;
    const currentEnd = toIsoDate(meta.report_end_date);
    const prior = pickPriorEntry(facility.reports, currentReportId, currentEnd);
    if (!prior) return null;
    return facility.snapshots?.[prior.report_id] || null;
  }

  function loadHistoricalSnapshotsLocal(meta, currentReportId) {
    if (!shouldPersistLocalHistory()) return [];
    const history = loadHistory();
    const facility = history.facilities[slugify(meta.facility)];
    if (!facility || !Array.isArray(facility.reports)) return [];

    const currentEnd = toIsoDate(meta.report_end_date);
    const reports = facility.reports
      .filter((report) => report?.report_id && report.report_id !== currentReportId)
      .filter((report) => {
        if (!currentEnd) return true;
        const end = String(report.report_end_date || "");
        return !end || end <= currentEnd;
      })
      .sort(compareReportEntriesByDate);

    return reports
      .map((report) => facility.snapshots?.[report.report_id])
      .filter((snapshot) => snapshot && typeof snapshot === "object");
  }

  async function loadPriorSnapshotFromCloud(meta, currentReportId) {
    const url = buildHistoryApiUrl("/history/prior");
    if (!url) return null;
    const response = await postJsonWithTimeout(url, {
      facility: meta?.facility || "",
      current_report_id: currentReportId,
      current_report_end_date: toIsoDate(meta?.report_end_date),
    });
    if (response && typeof response === "object" && "snapshot" in response) {
      return response.snapshot || null;
    }
    return null;
  }

  async function saveSnapshotToCloud(snapshot) {
    const url = buildHistoryApiUrl("/history/save");
    if (!url) return;
    return postJsonWithTimeout(url, { snapshot });
  }

  async function loadPriorSnapshot(_meta, _currentReportId) {
    /* Returns null: prior-report comparison requires persistent history,
       which is disabled to prevent PHI storage. */
    setHistoryScope("none");
    return null;
  }

  async function saveSnapshot(_meta, _rows, _reportId, _generatedIso) {
    /* No-op: history persistence is disabled to prevent PHI storage. */
    return null;
  }

  async function _saveSnapshot_disabled(meta, rows, reportId, generatedIso) {
    const localSnapshot = saveSnapshotLocal(meta, rows, reportId, generatedIso);
    if (!isCloudHistoryConfigured()) {
      setHistoryScope("local");
      return localSnapshot;
    }

    try {
      const response = await saveSnapshotToCloud(localSnapshot);
      appendLocalAuditEntry("snapshot_saved", {
        facility: meta.facility,
        report_id: reportId,
        report_end_date: toIsoDate(meta.report_end_date) || "",
        wound_count: rows.length,
        retention_deleted_rows: Number(response?.retention?.deleted_rows || 0),
        retention_reason: response?.retention?.reason || "",
      }, "cloud");
      setHistoryScope("cloud");
    } catch (err) {
      const fallbackMsg = shouldPersistLocalHistory()
        ? "Cloud snapshot save failed. Local history was still saved."
        : "Cloud snapshot save failed. Local history backup is disabled in cloud-only mode.";
      console.warn(fallbackMsg, err);
      setHistoryScope("fallback");
    }
    return localSnapshot;
  }

  function renderSelectOptions(options, selectedValue) {
    return (options || [])
      .map((opt) => {
        const selected = opt.value === selectedValue ? " selected" : "";
        return `<option value="${escapeHtml(opt.value)}"${selected}>${escapeHtml(opt.label)}</option>`;
      })
      .join("");
  }

  function renderChecklistOptions(options, selectedValues, field) {
    const selectedSet = new Set(Array.isArray(selectedValues) ? selectedValues : []);
    return (options || []).map((opt) => {
      const checked = selectedSet.has(opt.value) ? " checked" : "";
      return `<label><input type="checkbox" value="${escapeHtml(opt.value)}"${checked} /><span>${escapeHtml(opt.label)}</span></label>`;
    }).join("");
  }


  function formatWoundTypeHtml(value, detailedRow, rowIdx) {
    return escapeHtml(value || "");
  }

  function formatPreviewCell(column, row, detailedRow, rowIdx) {
    if (column === "considerations") return formatConsiderationsHtml(row[column], detailedRow);
    if (column === "wound_type") return formatWoundTypeHtml(row[column], detailedRow, rowIdx);
    return escapeHtml(row[column] ?? "");
  }

  function buildPreviewRowHtml(row, rowIdx, columns, detailedRows) {
    return `<tr id="preview-row-${escapeHtml(String(rowIdx))}" data-row-index="${escapeHtml(String(rowIdx))}">${columns.map((c) => {
      const classes = [];
      if (c === "considerations") classes.push("multiline-cell");
      if (c === "wound_type") classes.push("wound-type-cell");
      const classAttr = classes.length ? ` class="${classes.join(" ")}"` : "";
      return `<td${classAttr}>${formatPreviewCell(c, row, detailedRows[rowIdx], rowIdx)}</td>`;
    }).join("")}</tr>`;
  }

  function renderPreviewChunked(columns, rows, detailedRows, token) {
    els.previewBody.innerHTML = "";
    let idx = 0;

    const renderChunk = () => {
      if (token !== previewRenderToken) return;
      const end = Math.min(rows.length, idx + PREVIEW_CHUNK_SIZE);
      let html = "";
      while (idx < end) {
        html += buildPreviewRowHtml(rows[idx], idx, columns, detailedRows);
        idx += 1;
      }
      if (html) els.previewBody.insertAdjacentHTML("beforeend", html);
      if (idx < rows.length) {
        window.requestAnimationFrame(renderChunk);
      }
    };

    window.requestAnimationFrame(renderChunk);
  }

  function renderPreview(columns, rows, detailedRows = []) {
    previewRenderToken += 1;
    const token = previewRenderToken;
    const displayColumns = ["considerations"];
    if (!rows.length) {
      els.previewHead.innerHTML = "";
      els.previewBody.innerHTML = "";
      return;
    }

    els.previewHead.innerHTML = "";

    if (rows.length > PREVIEW_CHUNK_THRESHOLD) {
      renderPreviewChunked(displayColumns, rows, detailedRows, token);
      return;
    }

    els.previewBody.innerHTML = rows
      .map((row, rowIdx) => buildPreviewRowHtml(row, rowIdx, displayColumns, detailedRows))
      .join("");
  }

  function collectOverrideValuesFromBox(box) {
    const selectValue = (field) => box.querySelector(`select[data-override-field="${field}"]`)?.value || "";
    const checkedValues = (field) => Array.from(
      box.querySelectorAll(`[data-override-field="${field}"] input[type="checkbox"]:checked`)
    ).map((input) => input.value);

    return normalizeManualOverrides({
      diabetic: selectValue("diabetic"),
      thickness: selectValue("thickness"),
      exudate_amount: selectValue("exudate_amount"),
      exudate_type: selectValue("exudate_type"),
      odor: selectValue("odor"),
      exposed_structures: checkedValues("exposed_structures"),
      infection_signs: checkedValues("infection_signs"),
    });
  }


  function formatQaValue(value, decimals = 2, unit = "") {
    const n = Number(value);
    if (!Number.isFinite(n)) return "n/a";
    const formatted = formatNarrativeNumber(n, decimals);
    if (!formatted) return "n/a";
    return unit ? `${formatted}${unit}` : formatted;
  }

  function formatQaSigned(value, decimals = 1, unit = "") {
    const n = Number(value);
    if (!Number.isFinite(n)) return "n/a";
    const sign = n > 0 ? "+" : (n < 0 ? "-" : "");
    const magnitude = formatNarrativeNumber(Math.abs(n), decimals);
    if (!magnitude) return "n/a";
    return unit ? `${sign}${magnitude}${unit}` : `${sign}${magnitude}`;
  }

  function buildQaMetricLine(label, priorValue, currentValue, deltaValue, valueDecimals = 2, deltaDecimals = 1, valueUnit = "", deltaUnit = "") {
    const priorText = formatQaValue(priorValue, valueDecimals, valueUnit);
    const currentText = formatQaValue(currentValue, valueDecimals, valueUnit);
    const deltaText = formatQaSigned(deltaValue, deltaDecimals, deltaUnit);
    const deltaPhrase = deltaText === "n/a" ? "Delta n/a" : `Delta ${deltaText}`;
    return `<div class="qa-line"><span class="qa-label">${escapeHtml(label)}</span><span class="qa-value">Prior ${escapeHtml(priorText)} -> Current ${escapeHtml(currentText)} (${escapeHtml(deltaPhrase)})</span></div>`;
  }

  function buildClinicalQaHtml(detailedRow = null) {
    if (!detailedRow || typeof detailedRow !== "object") return "";

    const signal = String(detailedRow.treatment_effect_signal || "").trim();
    if (!signal) return "";

    const priorDate = String(detailedRow.prior_assessment_date || "").trim();
    const currentDate = String(detailedRow.assessment_date || "").trim();
    const statusChange = String(detailedRow.status_change_since_prior_report || "").trim();
    const noPrior = normalizeText(signal) === "no prior wound match";
    const qualityFlags = Array.isArray(detailedRow.data_quality_flags)
      ? detailedRow.data_quality_flags.filter((item) => String(item || "").trim())
      : buildDataQualityFlagsForRow(detailedRow);
    const qualitySummary = qualityFlags.length
      ? `Weak inputs: ${qualityFlags.join("; ")}`
      : "No weak-input flags detected";
    const confidenceLabel = String(detailedRow.recommendation_confidence_label || "").trim();
    const confidenceScore = Number(detailedRow.recommendation_confidence_score);
    const confidenceSummary = String(detailedRow.recommendation_confidence_summary || "").trim();
    const confidenceLine = (confidenceLabel && Number.isFinite(confidenceScore))
      ? `${confidenceLabel} (${confidenceScore}/100)${confidenceSummary ? ` - ${confidenceSummary}` : ""}`
      : "";

    const line = (label, value, muted = false) => `<div class="qa-line"><span class="qa-label">${escapeHtml(label)}</span><span class="qa-value${muted ? " qa-muted" : ""}">${escapeHtml(value)}</span></div>`;

    const lines = [
      line("Signal", signal),
      line("Recommendation Confidence", confidenceLine || "n/a", !confidenceLine),
      line(
        "Assessment Dates",
        noPrior
          ? `Current ${currentDate || "n/a"} (no prior matched assessment)`
          : `Prior ${priorDate || "n/a"} -> Current ${currentDate || "n/a"}`,
        noPrior,
      ),
      line("Data Quality", qualitySummary, !qualityFlags.length),
      buildQaMetricLine(
        "Area (cm2)",
        detailedRow.prior_area_cm2,
        detailedRow.area_cm2,
        detailedRow.area_change_pct_since_prior_report,
        2,
        1,
        "",
        "%",
      ),
      buildQaMetricLine(
        "Depth (cm)",
        detailedRow.prior_depth_cm,
        detailedRow.depth_cm,
        detailedRow.depth_change_cm_since_prior_report,
        2,
        2,
      ),
      buildQaMetricLine(
        "Slough (%)",
        detailedRow.prior_slough_pct_mid,
        detailedRow.slough_pct_mid,
        detailedRow.slough_change_pts_since_prior_report,
        1,
        1,
        "%",
        " pts",
      ),
      buildQaMetricLine(
        "Granulation (%)",
        detailedRow.prior_granulation_pct_mid,
        detailedRow.granulation_pct_mid,
        detailedRow.granulation_change_pts_since_prior_report,
        1,
        1,
        "%",
        " pts",
      ),
      line("Status Change", statusChange || "n/a", !statusChange),
    ];

    return `<details class="why-drawer qa-drawer"><summary>Clinical QA (Signal Inputs)</summary><div class="qa-box"><div class="qa-grid">${lines.join("")}</div></div></details>`;
  }

  function formatConsiderationsHtml(value, detailedRow = null) {
    const text = String(value ?? "");
    const lines = text.split(/\r?\n/);
    const lineHtml = lines.map((line) => {
      const escaped = escapeHtml(line);
      if (!line.trim()) return '<span class="step-spacer"></span>';
      if (/^Response Score:/i.test(line.trim())) {
        const payload = line.replace(/^Response Score:\s*/i, "").trim();
        const [signalRaw, ...metrics] = payload.split(/\s+\|\s+/);
        const signal = signalRaw || "Indeterminate";
        const tone = responseToneFromSignal(signal);
        const metricHtml = metrics.map((metric) => `<span class="response-metric">${escapeHtml(metric)}</span>`).join("");
        return `<span class="response-line"><span class="response-pill ${tone}">${escapeHtml(signal)}</span>${metricHtml}</span>`;
      }
      if (/^Safety Check:/i.test(line.trim())) {
        return `<span class="safety-line">${escaped}</span>`;
      }
      if (/^Confidence:/i.test(line.trim())) {
        return `<span class="confidence-line">${escaped}</span>`;
      }
      if (/^Data Quality:/i.test(line.trim())) {
        return `<span class="data-quality-line">${escaped}</span>`;
      }
      if (/^\d+\)\s*Debridement Consideration:/i.test(line.trim())) {
        return `<span class="debridement-line">${escaped}</span>`;
      }
      return escaped;
    }).join("<br/>");

    const rationaleBlocks = Array.isArray(detailedRow?.stepwise_rationale_blocks)
      ? detailedRow.stepwise_rationale_blocks
      : [];
    const qaHtml = buildClinicalQaHtml(detailedRow);

    const drawerHtml = rationaleBlocks.map((block) => {
      const items = Array.isArray(block.items) ? block.items : [];
      if (!items.length) return "";
      const list = items.map((item) => {
        const sourceLabel = String(item.source_reference || "").trim();
        const sourceUrl = String(item.source_url || "").trim();
        const sourceBit = sourceLabel
          ? (sourceUrl ? ` Source: <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(sourceLabel)}</a>.` : ` Source: ${escapeHtml(sourceLabel)}.`)
          : "";
        return `<li><strong>${escapeHtml(item.option || "")}</strong>: ${escapeHtml(item.rationale || "")}${sourceBit}</li>`;
      }).join("");
      return `<details class="why-drawer"><summary>Why this? Step ${escapeHtml(block.step_number)} - ${escapeHtml(block.title || "Step")}</summary><ul>${list}</ul></details>`;
    }).join("");

    const drawerParts = [];
    if (drawerHtml.trim()) drawerParts.push(drawerHtml);
    if (qaHtml.trim()) drawerParts.push(qaHtml);
    if (!drawerParts.length) return lineHtml;
    return `${lineHtml}<div class="why-drawer-wrap">${drawerParts.join("")}</div>`;
  }


  function renderSources() {
    const sourceSections = CLINICAL_SOURCES.concat(CLINICAL_SOURCES_DEEP_DIVE);
    els.sourceList.innerHTML = sourceSections.map((section) => {
      const items = section.items
        .map((it) => `<li>${it.url ? `<a href="${escapeHtml(it.url)}" target="_blank" rel="noopener">${escapeHtml(it.label)}</a>` : escapeHtml(it.label)}</li>`)
        .join("");
      return `<section class="panel"><h3>${escapeHtml(section.title)}</h3><ul class="sources-list">${items}</ul></section>`;
    }).join("");

    const headers = ["category", "treatment_option", "evidence_signal", "clinical_notes", "source_reference"];
    els.sourceMapHead.innerHTML = `<tr>${headers.map((h) => `<th>${escapeHtml(h.replaceAll("_", " "))}</th>`).join("")}</tr>`;
    els.sourceMapBody.innerHTML = TREATMENT_CATALOG.map((row) => {
      return `<tr>${headers.map((h) => `<td>${escapeHtml(row[h] ?? "")}</td>`).join("")}</tr>`;
    }).join("");
  }

  const MANUAL_STAGE_OPTIONS = [
    { value: "", label: "Not documented" },
    { value: "Stage 1 Pressure Injury", label: "Stage 1 Pressure Injury" },
    { value: "Stage 2 Pressure Injury", label: "Stage 2 Pressure Injury" },
    { value: "Stage 3 Pressure Injury", label: "Stage 3 Pressure Injury" },
    { value: "Stage 4 Pressure Injury", label: "Stage 4 Pressure Injury" },
    { value: "Unstageable Pressure Injury", label: "Unstageable Pressure Injury" },
    { value: "Deep Tissue Pressure Injury", label: "Deep Tissue Pressure Injury" },
  ];

  const MANUAL_STAGE_NOT_APPLICABLE_OPTIONS = [
    { value: "", label: "Not applicable for wound type" },
  ];

  const MANUAL_BURN_STAGE_OPTIONS = [
    { value: "", label: "Not documented" },
    { value: "Superficial Burn", label: "Superficial Burn" },
    { value: "Partial-Thickness Burn", label: "Partial-Thickness Burn" },
    { value: "Full-Thickness Burn", label: "Full-Thickness Burn" },
  ];

  const MANUAL_ISTAP_OPTIONS = [
    { value: "", label: "Not documented" },
    { value: "ISTAP Type 1", label: "Type 1 — No skin loss (flap intact)" },
    { value: "ISTAP Type 2", label: "Type 2 — Partial flap loss" },
    { value: "ISTAP Type 3", label: "Type 3 — Total flap loss" },
  ];

  const MANUAL_PERIWOUND_OPTIONS = [
    { value: "", label: "Not assessed" },
    { value: "intact", label: "Intact / Normal" },
    { value: "macerated", label: "Macerated" },
    { value: "erythematous", label: "Erythematous / Red" },
    { value: "callused", label: "Callused / Hyperkeratotic" },
    { value: "friable", label: "Friable / Fragile" },
    { value: "indurated", label: "Indurated / Firm" },
    { value: "dermatitis", label: "Contact Dermatitis" },
    { value: "ecchymosis", label: "Ecchymosis / Bruising" },
    { value: "lipodermatosclerosis", label: "Lipodermatosclerosis" },
    { value: "hemosiderin", label: "Hemosiderin Staining" },
  ];

  const MANUAL_ABI_OPTIONS = [
    { value: "", label: "Not documented" },
    { value: "normal", label: "≥ 0.9 — Normal perfusion" },
    { value: "mild", label: "0.7–0.89 — Mild impairment" },
    { value: "moderate", label: "0.5–0.69 — Moderate impairment" },
    { value: "severe", label: "< 0.5 — Severe impairment" },
    { value: "calcified", label: "Non-compressible (calcified)" },
  ];

  const MANUAL_HS_HURLEY_OPTIONS = [
    { value: "", label: "Not documented" },
    { value: "Hurley Stage I", label: "Hurley Stage I — Single abscess, no sinus tracts" },
    { value: "Hurley Stage II", label: "Hurley Stage II — Recurrent abscesses, sinus tracts" },
    { value: "Hurley Stage III", label: "Hurley Stage III — Diffuse involvement, interconnected tracts" },
  ];

  const MANUAL_GRAFT_SITE_OPTIONS = [
    { value: "", label: "Not documented" },
    { value: "Donor site", label: "Donor Site" },
    { value: "Recipient site — graft intact", label: "Recipient Site — Graft Intact" },
    { value: "Recipient site — partial graft failure", label: "Recipient Site — Partial Graft Failure" },
    { value: "Recipient site — full graft failure", label: "Recipient Site — Full Graft Failure" },
  ];

  const MANUAL_WOUND_TYPE_OPTIONS = [
    { value: "", label: "Select wound type" },
    { value: "Pressure injury", label: "Pressure Injury" },
    { value: "Venous ulcer", label: "Venous Ulcer" },
    { value: "Diabetic foot ulcer", label: "Diabetic Foot Ulcer" },
    { value: "Arterial ulcer", label: "Arterial / Ischemic Ulcer" },
    { value: "Mixed arterial venous ulcer", label: "Mixed Arterial-Venous Ulcer" },
    { value: "Neuropathic ulcer", label: "Neuropathic Ulcer" },
    { value: "Burn", label: "Burn" },
    { value: "Radiation wound", label: "Radiation Wound / Radiation Burn" },
    { value: "Skin tear", label: "Skin Tear" },
    { value: "Surgical wound", label: "Surgical Wound / Dehiscence" },
    { value: "Traumatic wound", label: "Traumatic Wound" },
    { value: "Moisture associated skin damage", label: "Moisture-Associated Skin Damage" },
    { value: "Malignant wound", label: "Malignant / Fungating Wound" },
    { value: "Necrotizing fasciitis", label: "Necrotizing Fasciitis (Suspected)" },
    { value: "Calciphylaxis", label: "Calciphylaxis" },
    { value: "Osteomyelitis", label: "Osteomyelitis / Exposed Bone" },
    { value: "Fistula", label: "Fistula / Enterocutaneous" },
    { value: "Vasculitic ulcer", label: "Vasculitic Ulcer" },
    { value: "Martorell ulcer", label: "Martorell Ulcer (Hypertensive Ischemic)" },
    { value: "Hidradenitis suppurativa", label: "Hidradenitis Suppurativa" },
    { value: "Graft wound", label: "Graft Wound (STSG / Donor Site)" },
    { value: "Pyoderma gangrenosum", label: "Pyoderma Gangrenosum" },
    { value: "Other wound", label: "Other" },
  ];

  function getWoundFieldConfig(woundType) {
    const t = normalizeText(woundType);
    const isSkinTear   = t.includes("skin tear");
    const isMasd       = t.includes("masd") || t.includes("moisture") || t.includes("iad");
    const isNF         = t.includes("necrotizing") || t.includes("fournier") || t.includes("gas gangrene");
    const isCalciph    = t.includes("calciphylaxis");
    const isHS         = t.includes("hidradenitis");
    const isGraft      = t.includes("graft");
    const isVenous     = t.includes("venous") || t.includes("stasis");
    const isArterial   = t.includes("arterial") || t.includes("ischemic");
    const isDFU        = t.includes("diabetic") || t.includes("neuropathic");
    const isMixed      = t.includes("mixed");
    const isMartorell  = t.includes("martorell");
    const showAbi      = isVenous || isArterial || isDFU || isMixed || isMartorell;

    const isFistula    = t.includes("fistula") || t.includes("ecf");

    // Tissue % not meaningful for: skin tears, MASD, NF, calciphylaxis, fistula, HS (nodular), graft donor site
    const tissuePctDisabled = isSkinTear || isMasd || isNF || isCalciph || isFistula || isHS;

    // Depth not meaningful for: skin tears (superficial by definition), MASD
    const depthDisabled = isSkinTear || isMasd;

    // Exposed structures not applicable for: skin tears, MASD
    const exposedDisabled = isSkinTear || isMasd;

    // Infection signs: always relevant
    const infectionDisabled = false;

    // Tunneling/undermining: not for skin tears, MASD, or HS (sinus tracts are captured via stage)
    const tunnelDisabled = isSkinTear || isMasd;

    // ABI: relevant only for leg-ulcer types
    const abiDisabled = !showAbi && Boolean(t);

    return {
      tissuePctDisabled,
      depthDisabled,
      exposedDisabled,
      infectionDisabled,
      tunnelDisabled,
      abiDisabled,
    };
  }

  function updateManualFieldConfig(card) {
    if (!card) return;
    const woundType = readManualField(card, "wound_type");
    const cfg = getWoundFieldConfig(woundType);

    const setFieldDisabled = (fieldName, disabled, hint = "") => {
      const el = card.querySelector(`[data-field="${fieldName}"]`);
      if (!el) return;
      el.disabled = disabled;
      const wrapper = el.closest(".manual-field");
      if (wrapper) {
        wrapper.classList.toggle("is-disabled", disabled);
        // Update or add hint below field
        let hintEl = wrapper.querySelector(".field-type-hint");
        if (disabled && hint) {
          if (!hintEl) {
            hintEl = document.createElement("span");
            hintEl.className = "field-type-hint";
            wrapper.appendChild(hintEl);
          }
          hintEl.textContent = hint;
        } else if (hintEl) {
          hintEl.remove();
        }
      }
    };

    const disabledHint = "Not applicable for this wound type";

    // Tissue % fields
    ["slough_pct", "eschar_pct", "granulation_pct", "epithelialization_pct"].forEach((f) => {
      setFieldDisabled(f, cfg.tissuePctDisabled, disabledHint);
    });

    // Depth
    setFieldDisabled("depth_cm", cfg.depthDisabled, disabledHint);

    // Tunneling / undermining
    setFieldDisabled("tunneling", cfg.tunnelDisabled, disabledHint);
    setFieldDisabled("undermining", cfg.tunnelDisabled, disabledHint);

    // Exposed structures section
    const expSection = card.querySelector(".manual-check-section");
    if (expSection && expSection.querySelector("h4")?.textContent?.includes("Exposed")) {
      expSection.classList.toggle("is-disabled", cfg.exposedDisabled);
      expSection.querySelectorAll("input[type='checkbox']").forEach((cb) => {
        cb.disabled = cfg.exposedDisabled;
      });
    }

    // ABI: disable visually for non-leg wound types
    setFieldDisabled("abi_range", cfg.abiDisabled);
  }

  function burnClassificationFromStage(stage) {
    const text = normalizeText(stage);
    if (!text) return "";
    if (text.includes("full thickness") || text.includes("full-thickness") || text.includes("third degree") || text.includes("3rd degree")) return "full_thickness";
    if (text.includes("partial thickness") || text.includes("partial-thickness") || text.includes("second degree") || text.includes("2nd degree")) return "partial_thickness";
    if (text.includes("superficial") || text.includes("first degree") || text.includes("1st degree")) return "superficial";
    return "";
  }

  function thicknessValueForBurnClassification(stage) {
    const burnClass = burnClassificationFromStage(stage);
    if (burnClass === "superficial") return "superficial";
    if (burnClass === "partial_thickness") return "partial_thickness";
    if (burnClass === "full_thickness") return "full_thickness";
    return "";
  }

  function manualWoundTypeStageMode(woundType) {
    const text = normalizeText(woundType);
    if (!text) return "none";
    if (text.includes("burn") || text.includes("radiation")) return "burn";
    if (text.includes("pressure")) return "pressure";
    if (text.includes("skin tear")) return "skin_tear";
    if (text.includes("hidradenitis") || text.includes("hs")) return "hs";
    if (text.includes("graft")) return "graft";
    return "none";
  }

  function manualStageConfigForWoundType(woundType) {
    const mode = manualWoundTypeStageMode(woundType);
    if (mode === "burn") return { mode, label: "Burn Classification", options: MANUAL_BURN_STAGE_OPTIONS, disabled: false };
    if (mode === "pressure") return { mode, label: "Pressure Stage", options: MANUAL_STAGE_OPTIONS, disabled: false };
    if (mode === "skin_tear") return { mode, label: "ISTAP Classification", options: MANUAL_ISTAP_OPTIONS, disabled: false };
    if (mode === "hs") return { mode, label: "Hurley Stage", options: MANUAL_HS_HURLEY_OPTIONS, disabled: false };
    if (mode === "graft") return { mode, label: "Graft Site / Status", options: MANUAL_GRAFT_SITE_OPTIONS, disabled: false };
    return { mode, label: "Stage", options: MANUAL_STAGE_NOT_APPLICABLE_OPTIONS, disabled: true };
  }

  function updateManualStageSelect(card, field, config, labelPrefix = "") {
    const select = card?.querySelector(`select[data-field="${field}"]`);
    if (!select) return;
    const wrapper = select.closest("[data-stage-field]");
    const label = wrapper?.querySelector("[data-stage-label]");
    const options = config.options || MANUAL_STAGE_NOT_APPLICABLE_OPTIONS;
    const currentValue = select.value;
    const valueAllowed = options.some((opt) => opt.value === currentValue);
    select.innerHTML = renderSelectOptions(options, valueAllowed && !config.disabled ? currentValue : "");
    select.disabled = Boolean(config.disabled);
    if (wrapper) wrapper.classList.toggle("is-disabled", Boolean(config.disabled));
    if (label) label.textContent = `${labelPrefix}${config.label}`;
  }

  function updateManualStageControls(card) {
    if (!card) return;
    const woundType = readManualField(card, "wound_type");
    const config = manualStageConfigForWoundType(woundType);
    updateManualStageSelect(card, "stage", config);
    updateManualStageSelect(card, "prior_stage", config, "Prior ");
  }

  function syncThicknessFromBurnClassification(card) {
    if (!card) return;
    const woundType = readManualField(card, "wound_type");
    if (manualWoundTypeStageMode(woundType) !== "burn") return;
    const thicknessSelect = card.querySelector('select[data-field="thickness"]');
    if (!thicknessSelect) return;
    thicknessSelect.value = thicknessValueForBurnClassification(readManualField(card, "stage"));
  }

  const MANUAL_TUNNELING_OPTIONS = [
    { value: "", label: "Tunneling not assessed" },
    { value: "none", label: "No tunneling" },
    { value: "present", label: "Tunneling present" },
  ];

  const MANUAL_UNDERMINING_OPTIONS = [
    { value: "", label: "Undermining not assessed" },
    { value: "none", label: "No undermining" },
    { value: "present", label: "Undermining present" },
  ];

  const MANUAL_STATUS_OPTIONS = [
    { value: "Not Healed", label: "Not Healed" },
    { value: "Improving", label: "Improving" },
    { value: "Stable", label: "Stable" },
    { value: "Worsening", label: "Worsening" },
    { value: "Resolved", label: "Resolved" },
    { value: "", label: "Not documented" },
  ];

  function todayLocalIso() {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
  }

  function manualSelect(options, field, selectedValue = "") {
    return `<select data-field="${escapeHtml(field)}">${renderSelectOptions(options, selectedValue)}</select>`;
  }

  function manualInput(field, type = "text", placeholder = "", attrs = "") {
    return `<input data-field="${escapeHtml(field)}" type="${escapeHtml(type)}" placeholder="${escapeHtml(placeholder)}" ${attrs} />`;
  }

  function manualNumber(field, placeholder = "") {
    return manualInput(field, "number", placeholder, 'step="0.1" min="0" inputmode="decimal"');
  }

  const TISSUE_PCT_FIELDS = ["slough_pct", "eschar_pct", "epithelialization_pct", "granulation_pct"];

  function manualPercent(field) {
    return manualInput(field, "number", "%", 'step="10" min="0" max="100" inputmode="decimal"');
  }

  function updateTissuePctAlert(card) {
    const alert = card.querySelector("[data-tissue-alert]");
    if (!alert) return;
    let total = 0;
    let allBlank = true;
    for (const f of TISSUE_PCT_FIELDS) {
      const val = readManualField(card, f);
      if (val !== "") {
        allBlank = false;
        total += Number(val) || 0;
      }
    }
    if (allBlank) {
      alert.classList.remove("is-visible");
      return;
    }
    const rounded = Math.round(total * 10) / 10;
    if (rounded >= 99.5 && rounded <= 100.5) {
      alert.classList.remove("is-visible");
    } else {
      alert.textContent = `⚠ Tissue percentages total ${rounded}% — they should sum to 100%.`;
      alert.classList.add("is-visible");
    }
  }

  function buildManualChecklist(field, options, selectedValues = []) {
    return `<div class="manual-check-grid" data-field="${escapeHtml(field)}">${renderChecklistOptions(options, selectedValues, field)}</div>`;
  }

  function buildManualWoundCardHtml(cardNumber, seed = {}) {
    const selected = normalizeManualOverrides(seed.manual_overrides || {});
    return `
      <div class="manual-wound-head">
        <h3 class="manual-wound-title">Wound ${escapeHtml(String(cardNumber))}</h3>
        <button class="manual-remove-btn" type="button" data-manual-action="remove">Remove</button>
      </div>
      <div class="manual-grid">
        <label class="manual-field">
          <span>Patient Name</span>
          ${manualInput("name", "text", "First Last")}
        </label>
        <label class="manual-field">
          <span>Wound Type</span>
          ${manualSelect(MANUAL_WOUND_TYPE_OPTIONS, "wound_type", seed.wound_type || "")}
        </label>
        <label class="manual-field" data-stage-field="stage">
          <span data-stage-label>Stage</span>
          ${manualSelect(manualStageConfigForWoundType(seed.wound_type || "").options, "stage", manualStageConfigForWoundType(seed.wound_type || "").disabled ? "" : (seed.stage || ""))}
        </label>
        <label class="manual-field">
          <span>Status</span>
          ${manualSelect(MANUAL_STATUS_OPTIONS, "status", seed.status || "Not Healed")}
        </label>
        <label class="manual-field">
          <span>Location</span>
          ${manualInput("location", "text", "Sacrum, heel, left leg")}
        </label>
        <label class="manual-field">
          <span>Assessment Date</span>
          ${manualInput("assessment_date", "date", "")}
        </label>
        <label class="manual-field">
          <span>Date Acquired</span>
          ${manualInput("date_acquired", "date", "")}
        </label>
      </div>
      <div class="manual-measure-grid manual-prior">
        <label class="manual-field">
          <span>Length (cm)</span>
          ${manualNumber("length_cm", "0")}
        </label>
        <label class="manual-field">
          <span>Width (cm)</span>
          ${manualNumber("width_cm", "0")}
        </label>
        <label class="manual-field">
          <span>Depth (cm)</span>
          ${manualNumber("depth_cm", "0")}
        </label>
        <label class="manual-field">
          <span>Slough %</span>
          ${manualPercent("slough_pct")}
        </label>
        <label class="manual-field">
          <span>Eschar %</span>
          ${manualPercent("eschar_pct")}
        </label>
        <label class="manual-field">
          <span>Epithelialization %</span>
          ${manualPercent("epithelialization_pct")}
        </label>
        <label class="manual-field">
          <span>Granulation %</span>
          ${manualPercent("granulation_pct")}
        </label>
      </div>
      <div data-tissue-alert class="tissue-pct-alert"></div>
      <details class="manual-prior manual-clinical-details">
        <summary>Clinical Details <span class="manual-details-hint">(wound characteristics, infection flags)</span></summary>
        <div class="manual-grid manual-prior">
          <label class="manual-field">
            <span>Diabetic</span>
            ${manualSelect([{ value: "", label: "Not set" }, { value: "yes", label: "Yes" }, { value: "no", label: "No" }], "diabetic", selected.diabetic)}
          </label>
          <label class="manual-field">
            <span>Thickness of Wound</span>
            ${manualSelect(OVERRIDE_THICKNESS_OPTIONS, "thickness", selected.thickness)}
          </label>
          <label class="manual-field">
            <span>Exudate Amount</span>
            ${manualSelect(OVERRIDE_EXUDATE_AMOUNT_OPTIONS, "exudate_amount", selected.exudate_amount)}
          </label>
          <label class="manual-field">
            <span>Exudate Type</span>
            ${manualSelect(OVERRIDE_EXUDATE_TYPE_OPTIONS, "exudate_type", selected.exudate_type)}
          </label>
          <label class="manual-field">
            <span>Odor</span>
            ${manualSelect(OVERRIDE_ODOR_OPTIONS, "odor", selected.odor)}
          </label>
          <label class="manual-field">
            <span>Tunneling</span>
            ${manualSelect(MANUAL_TUNNELING_OPTIONS, "tunneling", "")}
          </label>
          <label class="manual-field">
            <span>Undermining</span>
            ${manualSelect(MANUAL_UNDERMINING_OPTIONS, "undermining", "")}
          </label>
          <label class="manual-field">
            <span>Periwound Skin</span>
            ${manualSelect(MANUAL_PERIWOUND_OPTIONS, "periwound_condition", seed.periwound_condition || "")}
          </label>
          <label class="manual-field">
            <span>ABI / Perfusion (leg ulcers)</span>
            ${manualSelect(MANUAL_ABI_OPTIONS, "abi_range", seed.abi_range || "")}
          </label>
        </div>
        <div class="manual-grid manual-prior">
          <div class="manual-check-section">
            <h4>Exposed Structures</h4>
            ${buildManualChecklist("exposed_structures", OVERRIDE_EXPOSED_STRUCTURE_OPTIONS, selected.exposed_structures)}
          </div>
          <div class="manual-check-section">
            <h4>Signs/Symptoms of Infection</h4>
            ${buildManualChecklist("infection_signs", OVERRIDE_INFECTION_SIGN_OPTIONS, selected.infection_signs)}
          </div>
        </div>
      </details>
      <details class="manual-prior">
        <summary>Optional prior measurement for this wound</summary>
        <div class="manual-grid manual-prior">
          <label class="manual-field">
            <span>Prior Assessment Date</span>
            ${manualInput("prior_assessment_date", "date", "")}
          </label>
          <label class="manual-field" data-stage-field="prior_stage">
            <span data-stage-label>Prior Stage</span>
            ${manualSelect(manualStageConfigForWoundType(seed.wound_type || "").options, "prior_stage", "")}
          </label>
          <label class="manual-field">
            <span>Prior Status</span>
            ${manualSelect(MANUAL_STATUS_OPTIONS, "prior_status", "")}
          </label>
        </div>
        <div class="manual-measure-grid manual-prior">
          <label class="manual-field">
            <span>Prior Length (cm)</span>
            ${manualNumber("prior_length_cm", "0")}
          </label>
          <label class="manual-field">
            <span>Prior Width (cm)</span>
            ${manualNumber("prior_width_cm", "0")}
          </label>
          <label class="manual-field">
            <span>Prior Depth (cm)</span>
            ${manualNumber("prior_depth_cm", "0")}
          </label>
          <label class="manual-field">
            <span>Prior Slough %</span>
            ${manualPercent("prior_slough_pct")}
          </label>
          <label class="manual-field">
            <span>Prior Eschar %</span>
            ${manualPercent("prior_eschar_pct")}
          </label>
          <label class="manual-field">
            <span>Prior Granulation %</span>
            ${manualPercent("prior_granulation_pct")}
          </label>
        </div>
      </details>
    `;
  }

  function addManualWoundCard(seed = {}) {
    if (!els.manualWoundList) return null;
    manualWoundSerial += 1;
    const card = document.createElement("section");
    card.className = "manual-wound-card";
    card.dataset.manualWoundId = String(manualWoundSerial);
    card.innerHTML = buildManualWoundCardHtml(els.manualWoundList.querySelectorAll(".manual-wound-card").length + 1, seed);
    els.manualWoundList.appendChild(card);
    renumberManualWoundCards();
    if (seed.wound_type) {
      updateManualStageControls(card);
      updateManualFieldConfig(card);
    }
    return card;
  }

  function renumberManualWoundCards() {
    if (!els.manualWoundList) return;
    const cards = Array.from(els.manualWoundList.querySelectorAll(".manual-wound-card"));
    cards.forEach((card, idx) => {
      const title = card.querySelector(".manual-wound-title");
      if (title) title.textContent = `Wound ${idx + 1}`;
      const remove = card.querySelector("[data-manual-action='remove']");
      if (remove) remove.disabled = cards.length <= 1;
    });
    if (!cards.length) {
      els.manualWoundList.innerHTML = '<p class="manual-empty">Add at least one wound to generate considerations.</p>';
    }
  }

  function ensureManualWoundCard() {
    if (!els.manualWoundList) return;
    if (!els.manualWoundList.querySelector(".manual-wound-card")) {
      els.manualWoundList.innerHTML = "";
      addManualWoundCard();
    }
  }

  function handleManualWoundListClick(event) {
    const remove = event.target.closest("[data-manual-action='remove']");
    if (!remove) return;
    event.preventDefault();
    const card = remove.closest(".manual-wound-card");
    const cards = els.manualWoundList ? els.manualWoundList.querySelectorAll(".manual-wound-card") : [];
    if (!card || cards.length <= 1) return;
    card.remove();
    renumberManualWoundCards();
  }

  function readManualField(card, field) {
    const input = card.querySelector(`[data-field="${field}"]`);
    return String(input?.value || "").trim();
  }

  function readManualChecklist(card, field) {
    return Array.from(card.querySelectorAll(`[data-field="${field}"] input[type="checkbox"]:checked`))
      .map((input) => input.value)
      .filter(Boolean);
  }

  function readManualNumber(card, field) {
    const raw = readManualField(card, field);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  function textForManualPresence(value, presentText) {
    const normalized = normalizeText(value);
    if (normalized === "present") return presentText;
    if (normalized === "none") return "none";
    return "";
  }

  function manualFieldDocumented(card, field) {
    return readManualField(card, field) !== "";
  }

  function manualPriorHasSignal(card) {
    return [
      "prior_stage",
      "prior_status",
      "prior_length_cm",
      "prior_width_cm",
      "prior_depth_cm",
      "prior_slough_pct",
      "prior_eschar_pct",
      "prior_granulation_pct",
    ].some((field) => manualFieldDocumented(card, field));
  }

  function readManualOverridesFromCard(card) {
    return normalizeManualOverrides({
      diabetic: readManualField(card, "diabetic"),
      thickness: readManualField(card, "thickness"),
      exudate_amount: readManualField(card, "exudate_amount"),
      exudate_type: readManualField(card, "exudate_type"),
      odor: readManualField(card, "odor"),
      exposed_structures: readManualChecklist(card, "exposed_structures"),
      infection_signs: readManualChecklist(card, "infection_signs"),
    });
  }

  function buildManualRecord(card, meta, manualOverrides, prefix = "") {
    const defaultDate = toIsoDate(meta.report_end_date) || todayLocalIso();
    const name = normalizePersonName(readManualField(card, "name"));
    const mrn = "";
    const woundNumber = "";
    const woundType = readManualField(card, "wound_type");
    const location = readManualField(card, "location");
    const stage = readManualField(card, `${prefix}stage`) || (!prefix ? readManualField(card, "stage") : readManualField(card, "stage"));
    const status = readManualField(card, `${prefix}status`) || (!prefix ? readManualField(card, "status") : readManualField(card, "status"));
    const assessmentDate = parseDate(readManualField(card, `${prefix}assessment_date`) || (!prefix ? readManualField(card, "assessment_date") : "") || defaultDate);
    const lengthCm = readManualNumber(card, `${prefix}length_cm`);
    const widthCm = readManualNumber(card, `${prefix}width_cm`);
    const depthCm = readManualNumber(card, `${prefix}depth_cm`);
    const areaCm2 = Number((lengthCm * widthCm).toFixed(2));
    const tunnelingText = prefix ? "" : textForManualPresence(readManualField(card, "tunneling"), "tunneling present");
    const underminingText = prefix ? "" : textForManualPresence(readManualField(card, "undermining"), "undermining present");
    const exposedText = labelsForOverrideValues(manualOverrides.exposed_structures).join(", ");
    const infectionText = labelsForOverrideValues(manualOverrides.infection_signs).join(", ");

    const record = {
      name,
      mrn,
      wound_number: woundNumber,
      wound_type: woundType,
      assessment_date: assessmentDate,
      stage,
      location,
      acquired_at_facility: "",
      date_acquired: parseDate(readManualField(card, "date_acquired")),
      admission_date: null,
      discharge_date: null,
      status,
      size_documented: manualFieldDocumented(card, `${prefix}length_cm`) || manualFieldDocumented(card, `${prefix}width_cm`) || manualFieldDocumented(card, `${prefix}depth_cm`),
      status_documented: Boolean(status),
      slough_pct: readManualNumber(card, `${prefix}slough_pct`),
      eschar_pct: readManualNumber(card, `${prefix}eschar_pct`),
      epithelialization_pct: prefix ? 0 : readManualNumber(card, "epithelialization_pct"),
      granulation_pct: readManualNumber(card, `${prefix}granulation_pct`),
      slough_documented: manualFieldDocumented(card, `${prefix}slough_pct`),
      eschar_documented: manualFieldDocumented(card, `${prefix}eschar_pct`),
      epithelialization_documented: prefix ? false : manualFieldDocumented(card, "epithelialization_pct"),
      granulation_documented: manualFieldDocumented(card, `${prefix}granulation_pct`),
      exudate_amount_text: prefix ? "" : labelForOverrideValue(manualOverrides.exudate_amount),
      exudate_type_text: prefix ? "" : labelForOverrideValue(manualOverrides.exudate_type),
      odor_text: prefix ? "" : labelForOverrideValue(manualOverrides.odor),
      tunneling_text: tunnelingText,
      undermining_text: underminingText,
      exposed_structures_text: prefix ? "" : exposedText,
      infection_signs_text: prefix ? "" : infectionText,
      periwound_text: prefix ? "" : (readManualField(card, "periwound_condition") || ""),
      periwound_condition: prefix ? "" : readManualField(card, "periwound_condition"),
      abi_range: prefix ? "" : readManualField(card, "abi_range"),
      pain_text: "",
      exudate_amount_documented: !prefix && Boolean(manualOverrides.exudate_amount),
      exudate_type_documented: !prefix && Boolean(manualOverrides.exudate_type),
      odor_documented: !prefix && Boolean(manualOverrides.odor),
      tunneling_documented: !prefix && Boolean(readManualField(card, "tunneling")),
      undermining_documented: !prefix && Boolean(readManualField(card, "undermining")),
      exposed_structures_documented: !prefix && Boolean(manualOverrides.exposed_structures.length),
      infection_signs_documented: !prefix && Boolean(manualOverrides.infection_signs.length),
      periwound_documented: !prefix && Boolean(readManualField(card, "periwound_condition")),
      pain_documented: false,
      length_cm: Number(lengthCm.toFixed(2)),
      width_cm: Number(widthCm.toFixed(2)),
      depth_cm: Number(depthCm.toFixed(2)),
      area_cm2: areaCm2,
      stage_score: stageScore(stage),
      manual_overrides: prefix ? null : manualOverrides,
    };

    const personKey = record.mrn || normalizeText(record.name) || `manual-${card.dataset.manualWoundId || "wound"}`;
    const cardKey = `manual:${card.dataset.manualWoundId || "wound"}`;
    const keyPartPrimary = [record.wound_number, normalizeText(record.location), cardKey].filter(Boolean).join("|");
    const keyPartSecondary = [normalizeText(record.wound_type), normalizeText(record.stage)].filter(Boolean).join("|");
    const keyPart = keyPartPrimary || keyPartSecondary || `manual:${card.dataset.manualWoundId || "wound"}`;
    record.wound_key = [personKey, keyPart].join("|");
    return record;
  }

  function buildManualAudit(cardCount, recordCount, warnings = []) {
    return {
      sheet_count: 1,
      totals: {
        rows_scanned: cardCount,
        parsed_rows: recordCount,
        skipped_no_header_sheet: 0,
        skipped_missing_patient: 0,
        skipped_no_wound_signal: 0,
        skipped_repeated_header: 0,
      },
      sheets: [
        {
          sheet_name: "Manual wound entries",
          header_row_index: 0,
          rows_scanned: cardCount,
          parsed_rows: recordCount,
          skipped_blank_rows: 0,
          skipped_missing_patient: 0,
          skipped_no_wound_signal: 0,
          skipped_repeated_header: 0,
          note: "Direct-entry workflow; entries were typed on this page.",
        },
      ],
      warnings,
    };
  }

  function buildManualInputPayload() {
    ensureManualWoundCard();
    const cards = Array.from(els.manualWoundList.querySelectorAll(".manual-wound-card"));
    if (!cards.length) throw new Error("Add at least one wound.");

    const fallbackDate = todayLocalIso();
    const topDate = parseDate(fallbackDate);
    const meta = {
      facility: "Manual Entry",
      report_start_date: topDate,
      report_end_date: topDate,
      source_sheet: "Manual wound entry",
    };

    const records = [];
    const warnings = [];
    cards.forEach((card, idx) => {
      const name = readManualField(card, "name");
      if (!name) throw new Error(`Wound ${idx + 1}: enter patient name.`);

      const hasWoundSignal = [
        "wound_type",
        "stage",
        "location",
        "tunneling",
        "undermining",
        "length_cm",
        "width_cm",
        "depth_cm",
        "slough_pct",
        "eschar_pct",
        "granulation_pct",
      ].some((field) => manualFieldDocumented(card, field)) || hasAnyManualOverride(readManualOverridesFromCard(card));
      if (!hasWoundSignal) throw new Error(`Wound ${idx + 1}: enter at least one wound-specific field.`);

      const manual = readManualOverridesFromCard(card);
      const current = buildManualRecord(card, meta, manual);
      records.push(current);
      if (hasAnyManualOverride(manual)) {
        setStoredManualOverrides(current, manual);
      }

      if (manualPriorHasSignal(card)) {
        if (!manualFieldDocumented(card, "prior_assessment_date")) {
          throw new Error(`Wound ${idx + 1}: prior values need a prior assessment date.`);
        }
        const prior = buildManualRecord(card, meta, manual, "prior_");
        prior.wound_key = current.wound_key;
        records.push(prior);
      }
    });

    const currentDates = records
      .map((record) => record.assessment_date)
      .filter(Boolean)
      .sort((a, b) => a - b);
    if (currentDates.length) {
      meta.report_start_date = currentDates[0];
      meta.report_end_date = currentDates[currentDates.length - 1];
    }

    return {
      records,
      meta,
      audit: buildManualAudit(cards.length, records.length, warnings),
    };
  }

  async function analyzeReport(event) {
    event.preventDefault();

    try {
      setBusy(true);
      setStatus("Generating wound-specific considerations...");

      const { records, meta, audit } = buildManualInputPayload();

      const nowIso = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
      const reportId = buildReportId(meta, nowIso);

      const priorSnapshot = await loadPriorSnapshot(meta, reportId);
      const historicalSnapshots = loadHistoricalSnapshotsLocal(meta, reportId);
      if (priorSnapshot?.report_id && !historicalSnapshots.some((snap) => snap?.report_id === priorSnapshot.report_id)) {
        historicalSnapshots.push(priorSnapshot);
        historicalSnapshots.sort((a, b) => compareReportEntriesByDate(a, b));
      }

      const latestRows = buildLatestRows(records, historicalSnapshots);
      applyPriorComparison(latestRows, historicalSnapshots, priorSnapshot);
      const displayRows = buildDisplayRows(latestRows);

      const baseName = `wound_considerations_${toIsoDate(meta.report_end_date) || "manual"}`;
      latestOutputs = {
        rows: displayRows,
        detailedRows: latestRows,
        audit,
        meta,
        reportId,
        priorSnapshot,
        historicalSnapshots,
        priorSnapshotEnd: priorSnapshot?.report_end_date || "none found",
        baseName,
      };

      renderPreview(Object.keys(displayRows[0] || {}), displayRows, latestRows);
      els.narrativeText.innerHTML = buildChartNarrative(latestRows, narrativeStyle);

      els.narrativePanel.classList.remove("hidden");
      els.previewPanel.classList.remove("hidden");

      requestAnimationFrame(() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        els.previewPanel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      });

      logUsageEvent("analysis_completed", {
        parsed_rows: records.length,
        unique_wounds: latestRows.length,
      });
      setStatus(`Considerations complete — ${latestRows.length} wound${latestRows.length === 1 ? "" : "s"}. No data has been saved.`);
    } catch (err) {
      setStatus(`Error: ${err?.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  function init() {
    historyApiBase = resolveHistoryApiBase();
    historyApiToken = resolveHistoryApiToken();
    historyApiUseAccessJwt = resolveHistoryApiUseAccessJwt();
    if (els.historyApi) els.historyApi.value = historyApiBase;
    rerunOverrideStore = loadRerunOverrideStore();
    narrativeStyle = loadNarrativeStyle();
    narrativePhraseOverrides = loadNarrativePhraseOverrides();
    hipaaPolicy = loadHipaaPolicyLocal();
    if (els.settingsUserLabel) {
      els.settingsUserLabel.value = loadUserLabel();
    }
    if (els.narrativeStyle) els.narrativeStyle.value = narrativeStyle;
    renderPhraseEditor();
    renderAuditLog(loadLocalAuditEntries(), "session");

    supplyEntries = buildSupplyEntries();
    const storedSupplyPrefs = loadSupplyPrefs();
    const allSupplyKeys = supplyEntries.map((entry) => entry.key);
    if (storedSupplyPrefs && storedSupplyPrefs.size) {
      selectedSupplyKeys = new Set(allSupplyKeys.filter((key) => storedSupplyPrefs.has(key)));
      if (!selectedSupplyKeys.size) selectedSupplyKeys = new Set(allSupplyKeys);
    } else {
      selectedSupplyKeys = new Set(allSupplyKeys);
      saveSupplyPrefs();
    }
    ensureDeviceDebridementSuppliesSelected();

    renderSuppliesPanel();
    renderSources();
    ensureManualWoundCard();
    if (els.authLoginForm) els.authLoginForm.addEventListener("submit", handleLoginSubmit);
    if (els.authRegisterForm) els.authRegisterForm.addEventListener("submit", handleRegisterSubmit);
    if (els.authForgotForm) els.authForgotForm.addEventListener("submit", handleForgotSubmit);
    if (els.nameGateOverlay) {
      els.nameGateOverlay.addEventListener("click", (event) => {
        const navLink = event.target.closest("[data-auth-nav]");
        if (navLink) {
          event.preventDefault();
          showAuthView(navLink.dataset.authNav);
        }
      });
    }
    if (els.nameGateTermsLink) {
      els.nameGateTermsLink.addEventListener("click", openTermsDialog);
    }
    if (els.termsDialogClose) {
      els.termsDialogClose.addEventListener("click", closeTermsDialog);
    }
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && els.termsDialog && !els.termsDialog.hidden) closeTermsDialog();
    });
    document.addEventListener("focusin", guardNameGateFocus);
    initializeAuth();
    if (els.narrativeStyle) {
      els.narrativeStyle.addEventListener("change", (event) => {
        saveNarrativeStyle(event.target.value);
        rerenderNarrative();
        setStatus(`Narrative style set to ${narrativeStyle}.`);
      });
    }

    const togglePhraseEditorPanel = () => {
      els.phrasesPanel.classList.toggle("hidden");
      if (!els.phrasesPanel.classList.contains("hidden")) {
        renderPhraseEditor();
        els.phrasesPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const toggleSuppliesPanel = () => {
      els.suppliesPanel.classList.toggle("hidden");
      if (!els.suppliesPanel.classList.contains("hidden")) {
        els.suppliesPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const setAuditRemoteStatus = (msg, type = "info") => {
      if (!els.auditLogMeta) return;
      const colors = { info: "#5a1e28", ok: "#1a5c2a", warn: "#7a4800", error: "#8f2318" };
      els.auditLogMeta.innerHTML =
        `<span style="color:${colors[type] || colors.info};font-weight:700;">${escapeHtml(msg)}</span>` +
        `<button id="auditRetryBtn" type="button" style="margin-left:10px;font-size:0.78rem;padding:2px 10px;cursor:pointer;">↻ Retry Remote</button>`;
      const retryBtn = document.getElementById("auditRetryBtn");
      if (retryBtn) retryBtn.addEventListener("click", () => loadRemoteAuditLog());
    };

    const loadRemoteAuditLog = async () => {
      setAuditRemoteStatus("Fetching remote log from Cloudflare…", "info");
      const result = await fetchRemoteAuditLog();

      if (result.status === "ok") {
        renderAuditLog(result.data, `all sessions — Cloudflare KV (${result.data.length} events)`);
        setAuditRemoteStatus(`✓ Remote log loaded — ${result.data.length} events across all devices`, "ok");
        setStatus(`Loaded ${result.data.length} remote audit events.`);
        return;
      }

      /* Show local log and explain why remote failed */
      renderAuditLog(loadLocalAuditEntries(), "this session only");

      const messages = {
        kv_not_configured: "⚠ Cloudflare KV not configured — see AUDIT_SETUP.md to enable cross-device logging (Steps 1 & 2)",
        not_deployed:      "⚠ Audit endpoint not found — make sure the functions/audit.js file was uploaded to Cloudflare Pages",
        local_file:        "⚠ App opened as a local file — cross-device log requires deployment to Cloudflare Pages",
        network_error:     "⚠ Network error reaching remote log — check internet connection and try again",
        error:             `⚠ Server returned an unexpected error (${result.code || "unknown"}) — check Cloudflare Pages logs`,
      };
      const msg = messages[result.status] || "⚠ Could not load remote log";
      setAuditRemoteStatus(msg, "warn");
      setStatus(msg);
    };

    const openAuditLogPanel = async () => {
      /* Show local session log immediately */
      renderAuditLog(loadLocalAuditEntries(), "this session");
      if (els.auditLogMeta) els.auditLogMeta.textContent = "Loading remote log…";
      if (els.auditLogPanel) {
        els.auditLogPanel.classList.remove("hidden");
        els.auditLogPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      /* Admin-only user management */
      if (els.userAdminSection) {
        const admin = isCurrentUserAdmin();
        els.userAdminSection.classList.toggle("hidden", !admin);
        if (admin) loadUserAdmin();
      }
      /* Then load remote */
      await loadRemoteAuditLog();
    };

    if (els.userAdminRefresh) {
      els.userAdminRefresh.addEventListener("click", () => loadUserAdmin());
    }
    if (els.userAdminBody) {
      els.userAdminBody.addEventListener("click", onUserAdminClick);
    }

    if (els.settingsButton) {
      els.settingsButton.addEventListener("click", (e) => {
        e.preventDefault();
        const wasHidden = els.settingsPanel.classList.contains("hidden");
        els.settingsPanel.classList.toggle("hidden");
        if (!els.settingsPanel.classList.contains("hidden")) {
          els.settingsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (!wasHidden) {
        }
      });
    }

    if (els.addWoundButtonBottom) {
      els.addWoundButtonBottom.addEventListener("click", () => {
        addManualWoundCard();
        setStatus("Added another wound input.");
      });
    }

    if (els.manualWoundList) {
      els.manualWoundList.addEventListener("click", handleManualWoundListClick);
      els.manualWoundList.addEventListener("change", (event) => {
        const field = event.target?.dataset?.field;
        if (TISSUE_PCT_FIELDS.includes(field)) {
          const card = event.target.closest(".manual-wound-card");
          if (card) updateTissuePctAlert(card);
        }
        if (field === "wound_type") {
          const card = event.target.closest(".manual-wound-card");
          if (card) {
            updateManualStageControls(card);
            syncThicknessFromBurnClassification(card);
            updateManualFieldConfig(card);
          }
        }
        if (field === "stage") {
          const card = event.target.closest(".manual-wound-card");
          if (card) syncThicknessFromBurnClassification(card);
        }
      });
    }

    if (els.settingsClose) {
      els.settingsClose.addEventListener("click", () => {
        els.settingsPanel.classList.add("hidden");
      });
    }

    /* ── Secret 7-tap on logo → session log ─────────────────────────────── */
    (function () {
      const logo = document.getElementById("brandLogoMark");
      if (!logo) return;
      let tapCount = 0;
      let tapTimer = null;
      const TAPS_NEEDED = 7;
      const TAP_WINDOW_MS = 3000;

      function resetTaps() {
        tapCount = 0;
        clearTimeout(tapTimer);
      }

      logo.addEventListener("click", () => {
        tapCount += 1;
        clearTimeout(tapTimer);
        if (tapCount >= TAPS_NEEDED) {
          resetTaps();
          openAuditLogPanel();
          return;
        }
        tapTimer = setTimeout(resetTaps, TAP_WINDOW_MS);
      });
    })();

    if (els.narrativeText) {
      els.narrativeText.addEventListener("click", async (event) => {
        const btn = event.target.closest(".copy-narrative-btn");
        if (!btn) return;
        const text = btn.dataset.narrative || "";
        try {
          await navigator.clipboard.writeText(text);
          const original = btn.textContent;
          btn.textContent = "Copied ✓";
          btn.disabled = true;
          setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2000);
        } catch {
          /* Fallback for browsers without clipboard API */
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.cssText = "position:fixed;opacity:0;pointer-events:none;";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          btn.textContent = "Copied ✓";
          setTimeout(() => { btn.textContent = "Copy Narrative"; }, 2000);
        }
      });
    }

    if (els.settingsSaveUserLabelButton) {
      els.settingsSaveUserLabelButton.addEventListener("click", () => {
        const saved = saveUserLabel(els.settingsUserLabel?.value || "");
        logUsageEvent("user_label_updated", { user_label: saved || "(cleared)" }, { cloud: false, local: true });
        if (saved) {
          setStatus(`User label saved for logs: ${saved}`);
        } else {
          setStatus("User label cleared. Logs will use cloud identity when available.");
        }
      });
    }

    if (els.auditLogClose) {
      els.auditLogClose.addEventListener("click", () => {
        els.auditLogPanel.classList.add("hidden");
      });
    }

    if (els.settingsPhraseButton) {
      els.settingsPhraseButton.addEventListener("click", () => {
        togglePhraseEditorPanel();
      });
    }

    els.phrasesClose.addEventListener("click", () => {
      els.phrasesPanel.classList.add("hidden");
    });

    els.phrasesForm.addEventListener("submit", (event) => {
      event.preventDefault();
      narrativePhraseOverrides = collectPhraseEditorValues();
      saveNarrativePhraseOverrides();
      renderPhraseEditor();
      rerenderNarrative();
      setStatus("Narrative phrase updates saved.");
    });

    els.phrasesReset.addEventListener("click", () => {
      resetNarrativePhraseSetting();
      setStatus("Narrative phrases reset to defaults.");
    });

    if (els.settingsSuppliesButton) {
      els.settingsSuppliesButton.addEventListener("click", () => {
        toggleSuppliesPanel();
      });
    }

    if (els.settingsResetSuppliesButton) {
      els.settingsResetSuppliesButton.addEventListener("click", () => {
        resetSuppliesSetting();
        setStatus("Supplies filter reset to defaults (all included).");
      });
    }

    if (els.settingsResetPhrasesButton) {
      els.settingsResetPhrasesButton.addEventListener("click", () => {
        resetNarrativePhraseSetting();
        setStatus("Narrative phrases reset to defaults.");
      });
    }

    if (els.settingsResetNarrativeStyleButton) {
      els.settingsResetNarrativeStyleButton.addEventListener("click", () => {
        resetNarrativeStyleSetting();
        setStatus(`Narrative style reset to ${DEFAULT_NARRATIVE_STYLE}.`);
      });
    }

    els.suppliesClose.addEventListener("click", () => {
      els.suppliesPanel.classList.add("hidden");
    });

    els.suppliesSelectAll.addEventListener("click", () => {
      setAllSupplies(true);
      setStatus("All supplies selected. Re-run analysis to apply changes.");
    });

    els.suppliesClearAll.addEventListener("click", () => {
      setAllSupplies(false);
      setStatus("All supplies cleared. Re-run analysis to apply changes.");
    });

    els.sourceButton.addEventListener("click", (e) => {
      e.preventDefault();
      els.sourcesPanel.classList.toggle("hidden");
      if (!els.sourcesPanel.classList.contains("hidden")) {
        els.sourcesPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    els.sourcesClose.addEventListener("click", () => {
      els.sourcesPanel.classList.add("hidden");
    });

    if (els.printPacketButton) {
      els.printPacketButton.addEventListener("click", (event) => {
        event.preventDefault();
        openPrintPacket();
      });
    }
    window.addEventListener("afterprint", exitPrintPacketMode);

    els.analyzeForm.addEventListener("submit", analyzeReport);

    if (historyApiBase && !isCloudHistoryConfigured()) {
      setStatus("Ready. Cloud history URL found, but auth is not configured; running in local-only mode.");
    } else {
      setStatus("Ready. Enter wound details, then click Generate Considerations.");
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();