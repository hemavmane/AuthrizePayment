import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const handlePayment = (e) => {
    e.preventDefault();

    const authData = {
      clientKey: '5v8HKMm6T83s6d4P', // your client key from Authorize.Net
      apiLoginID: '7dR4bT8ycYjH', // your API login ID from Authorize.Net
    };

    const cardData = {
      cardNumber,
      month: expiry.split('/')[0],
      year: expiry.split('/')[1],
      cardCode: cvv,
    };

    window.Accept.dispatchData({
      authData,
      cardData,
    }, responseHandler);
  };

  const responseHandler = (response) => {
    if (response.messages.resultCode === "Error") {
      console.error("Error: " + response.messages.message[0].text);
      return;
    }

    const opaqueData = response.opaqueData;
    axios.post('https://<your-ngrok-subdomain>.ngrok.io/api/pay', { opaqueData })
      .then(res => {
        console.log(res.data);
      })
      .catch(err => {
        console.error(err);
      });
  };

  return (
    <form onSubmit={handlePayment}>
      <div>
        <label>Card Number:</label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Expiry Date (MM/YY):</label>
        <input
          type="text"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          required
        />
      </div>
      <div>
        <label>CVV:</label>
        <input
          type="text"
          value={cvv}
          onChange={(e) => setCvv(e.target.value)}
          required
        />
      </div>
      <button type="submit">Pay</button>
    </form>
  );
};

export default App;
