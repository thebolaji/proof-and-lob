const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();
const Lob = require("lob")(process.env.LOB_API_KEY);
const app = express();
app.use(bodyParser.json()); // For parsing application/json

// Function to create a new address
async function createAddress(
  name,
  addressLine1,
  city,
  state,
  zip,
  country = "US"
) {
  try {
    const address = await Lob.addresses.create({
      company: name,
      address_line1: addressLine1,
      address_city: city,
      address_state: state,
      address_zip: zip,
      address_country: country,
    });
    console.log("Address created:", address);
    return address;
  } catch (error) {
    console.error("Error creating address:", error);
  }
}

// Function to send a letter
async function sendLetter(toAddressId, fromAddressId, html) {
  try {
    const letter = await Lob.letters.create({
      description: "Test Letter",
      to: toAddressId,
      from: fromAddressId,
      file: html,
      color: true,
      address_placement: "insert_blank_page",
    });
    console.log("Letter sent:", letter);
    return letter;
  } catch (error) {
    console.error("Error sending letter:", error);
  }
}

// Function to handle webhooks (when Lob sends events to your server)
app.post("/webhook", (req, res) => {
  console.log("Webhook received:", req.body);
  // Do something with the webhook data here
  res.status(200).send("Webhook received");
});

// Simulate the full process
async function simulateMailProcess() {
  // Create the "to" and "from" addresses
  const toAddress = await createAddress(
    "Experian",
    "P.O. Box 4500",
    "Allen",
    "TX",
    "75013"
  );
  const fromAddress = await createAddress(
    "Jane Doe",
    "456 Sender St",
    "Los Angeles",
    "CA",
    "90001"
  );

  // Send a letter
  const letter = await sendLetter(
    toAddress.id,
    fromAddress.id,
    // "adr_96f5401e1ce1a431",
    // "adr_768bb170f31ed4a1",
    `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF Letter</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap" rel="stylesheet">

    <style>
@import url('https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap');
        body {
             font-family: "Indie Flower",Arial, sans-serif, cursive !important;
            font-size: 13px !important;
            margin: 20px;
            font-weight: 600 !important;
            line-height: 1.2 !important;
        }
        .flex-container {
            line-height: 0.5;
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            align-items: flex-start;
            width: 90%;
        }
        .left, {
            width: 45%;
        }

        .right {
            width: 45%;
            text-align: right;
        }

        .section {
            margin-bottom: 20px;
        }
        .highlighted-text {
        color: fuchsia;
        }
        .letter-footer {
            line-height: 0.5;
        }
        header {
            margin-bottom: 40px;
        }
    </style>
</head>
<body>
    <header>
        <div class="flex-container">
            <div class="left">
                <p>John Doe</p>
                <p>123 Main St, New York, NY</p>
                <p>SSN: 123-45-6789</p>
                <p>DOB: 01/01/1980</p>
            </div>
            <div class="right">
                <p>Equifax</p>
                <p>PO Box 740256</p>
                <p>Atlanta, GA</p>
            </div>
        </div>
    </header>

    <!-- Main content will go here -->
    <!-- src/views/letter.hbs -->
<div class="section">
    <p><strong>To whom it may concern:</strong></p>
    <p>I am writing to formally dispute inaccurate information on my credit report related
to an incorrect account rating for the account with XYZ Bank. The report reflects a
delinquency, which is erroneous, as all payments have been made on time. This
inaccuracy has negatively impacted my credit score, and I demand its immediate
investigation and correction.
Under  <span class="highlighted-text"> The Fair Credit Reporting Act (FCRA)</span>, credit reporting agencies are required  to maintain accurate and complete information. <span class="highlighted-text"> The Metro 2 standards</span> further reinforce the need for compliance in reporting consumer information. The continued
reporting of this false delinquency violates these legal obligations.

I request the following actions be taken immediately:

Proof of Delinquency: I demand full documentation that supports the claimed
delinquency for the account in question. This should include any relevant statements
or communications that verify such an issue.

Verification of Permissible Purpose: Provide evidence that this account rating and
related inquiry were made in compliance with the permissible purposes outlined by <span class="highlighted-text">The
FCRA Act (FCRA) and etro 2</span> guidelines.</p>
</div>

<div class="section highlight" >
    <p><strong>Personal Information:</strong></p>
    <ul>
        <li><strong>Name:</strong> My only name is <strong>John Doe</strong>, and your records must reflect this accurately. Any variation or incorrect names must be deleted.</li>
        <li><strong>Address:</strong> The correct current address is <strong>123 Main St, New York, NY</strong>. Any previous or unverified addresses should be removed from your system as they do not comply with FCRA or Metro 2 standards.</li>
    </ul>
</div>

<div class="section">
    <p>I also request proof of a permissible purpose for any inquiries on my report. You are required by law to provide documentation confirming the legitimacy of all inquiries made.</p>
</div>

<div class="section">
    <p>Please ensure that your response to this dispute is both timely and compliant with all relevant regulations. Failure to do so may lead to further action, including legal consultation, to protect my consumer rights. I expect a full investigation and correction of this matter within 30 days of receipt of this letter.
    </p>
</div>

<div class="section">
    <p>I look forward to receiving confirmation that these errors have been corrected and an updated credit report within
</p>
</div>
<div class="letter-footer">
        <p>Sincerely,</p>
        <p>John Doe</p>
        <p>123 Main St, New York, NY</p>
        <p>SSN: 123-45-6789</p>
        <p>DOB: 01/01/1980</p>
</div>
</body>
</html>
`
  );

  console.log({ letter });
}

// Run the simulation
simulateMailProcess();

// Webhook route for Lob notifications
app.listen(3000, () => {
  console.log("Webhook server is running on port 3000");
});
