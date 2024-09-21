const express = require("express");
const axios = require("axios");
const app = express();
require("dotenv").config();
const Bottleneck = require("bottleneck"); // Concurrency limiter

const limiter = new Bottleneck({
  maxConcurrent: 10, // Limit the number of concurrent requests
  minTime: 200, // Ensure at least 200ms between each request
});

// Middleware to parse JSON request bodies
app.use(express.json());

// Create a transaction for the signer
const createTransaction = async (signer) => {
  const options = {
    method: "POST",
    url: `${process.env.PROOF_BASE_URL}/v1/transactions?document_url_version=v1`,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      ApiKey: process.env.PROOF_API_KEY,
    },
    data: {
      signer: {
        proof_requirement: {
          id_verification: { selfie: true },
          knowledge_based_authentication: true,
          multi_factor_authentication: { type: "sms" },
        },
        email: signer.email,
        first_name: signer.first_name,
        last_name: signer.last_name,
      },
      draft: true,
      allow_signer_annotations: true,
      transaction_type: signer.transaction_type || "Dispute Letter",
      transaction_name: signer.transaction_name,
    },
  };

  try {
    const response = await axios.request(options);

    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
const updateTransaction = async (transactionId) => {
  const options = {
    method: "POST",
    url: `${process.env.PROOF_BASE_URL}/v1/transactions/${transactionId}/notarization_ready?document_url_version=v1`,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      ApiKey: process.env.PROOF_API_KEY,
    },
  };

  try {
    const response = await axios.request(options);

    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Add an individual document to a transaction
const addDocumentToTransaction = async (transactionId, documents) => {
  const options = {
    method: "POST",
    url: `${process.env.PROOF_BASE_URL}/v1/transactions/${transactionId}/documents?document_url_version=v1`,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      ApiKey: process.env.PROOF_API_KEY,
    },
    data: {
      document: documents.url,
      resource: documents.url,
      notarization_required: true,
      customer_can_annotate: true,
    },
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error(
      `Error adding document ${documents.url} to transaction:`,
      error
    );
    throw error;
  }
};

// Function to handle an array of documents and add them concurrently using the concurrency limiter
const addDocumentsToTransaction = async (transactionId, documents) => {
  const promises = documents.map((document) =>
    limiter.schedule(() => addDocumentToTransaction(transactionId, document))
  );

  try {
    const results = await Promise.all(promises); // Wait for all documents to be added
    return results;
  } catch (error) {
    console.error("Error adding documents to transaction:", error);
    throw error;
  }
};

// Single endpoint that handles both transaction creation and adding a document
app.post("/notarize", async (req, res) => {
  const { signer, documents } = req.body;

  try {
    let transactionResponse = await createTransaction(signer);
    console.log(`Transaction created: ${transactionResponse.transaction_name}`);

    const documentResponses = await addDocumentsToTransaction(
      transactionResponse.id,
      documents
    );
    console.log(`Documents added to transaction: ${transactionResponse.id}`);

    const sendNotorisation = await updateTransaction(transactionResponse.id);
    console.log({ sendNotorisation });
    return res.json({
      transaction: transactionResponse,
      documents: documentResponses,
      sent: sendNotorisation.status,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

// Webhook to wait for a response (placeholder for actual webhook implementation)
app.post("/webhook", (req, res) => {
  const webhookData = req.body;
  console.log("Webhook received:", webhookData);

  // Process webhook data here
  res.status(200).send("Webhook received");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
