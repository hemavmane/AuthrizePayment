const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ApiContracts, ApiControllers } = require('authorizenet');
require('dotenv').config();
const ngrok = require('@ngrok/ngrok');

const app = express();
const port = process.env.PORT || 8800;

app.use(cors());
app.use(bodyParser.json());

app.post('/api/pay', (req, res) => {
  const { opaqueData } = req.body;

  if (!opaqueData || !opaqueData.dataDescriptor || !opaqueData.dataValue) {
    return res.status(400).json({ success: false, message: 'Invalid data.' });
  }

  const merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
  merchantAuthenticationType.setName(process.env.LOGINID);
  merchantAuthenticationType.setTransactionKey(process.env.TRANSACTIONKEY);

  const opaqueDataType = new ApiContracts.OpaqueDataType();
  opaqueDataType.setDataDescriptor(opaqueData.dataDescriptor);
  opaqueDataType.setDataValue(opaqueData.dataValue);

  const paymentType = new ApiContracts.PaymentType();
  paymentType.setOpaqueData(opaqueDataType);

  const transactionRequestType = new ApiContracts.TransactionRequestType();
  transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
  transactionRequestType.setPayment(paymentType);
  transactionRequestType.setAmount('10.00'); // amount in USD

  const createRequest = new ApiContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuthenticationType);
  createRequest.setTransactionRequest(transactionRequestType);

  const ctrl = new ApiControllers.CreateTransactionController(createRequest.getJSON());

  ctrl.execute(() => {
    const apiResponse = ctrl.getResponse();
    const response = new ApiContracts.CreateTransactionResponse(apiResponse);

    if (response) {
      if (response.getMessages().getResultCode() === ApiContracts.MessageTypeEnum.OK) {
        res.status(200).json({ success: true, message: 'Transaction successful.' });
      } else {
        res.status(500).json({ success: false, message: response.getMessages().getMessage()[0].getText() });
      }
    } else {
      res.status(500).json({ success: false, message: 'No response from server.' });
    }
  });
});

// Start the Express server and ngrok tunnel
(async () => {
  try {
    app.listen(port, async () => {
      console.log(`Server running on port ${port}`);
      
      // Start ngrok tunnel
      try {
        const url = await ngrok.connect({
          addr: port,
          authtoken: process.env.NGROK_AUTHTOKEN,
        });
        console.log(`ngrok tunnel established at: ${url}`);
      } catch (error) {
        console.error('Error starting ngrok:', error);
      }
    });
  } catch (error) {
    console.error('Error starting the server:', error);
  }
})();
