"use client";

import { useState } from "react";
import styles from "./search.module.css";

const mockResults = [
  {
    id: 1,
    medicineName: "Paracetamol",
    pharmacyName: "HealthPlus Pharmacy",
    pharmacyId: "PHARMACY-001",
    location: "Lagos",
    price: 2500,
    quantity: 40,
  },
  {
    id: 2,
    medicineName: "Paracetamol",
    pharmacyName: "MedCare Pharmacy",
    pharmacyId: "PHARMACY-002",
    location: "Abuja",
    price: 2300,
    quantity: 18,
  },
];

const initialCustomerDetails = {
  fullName: "",
  phoneNumber: "",
  deliveryAddress: "",
};

export default function SearchPage() {
  const [medicineName, setMedicineName] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [customerDetails, setCustomerDetails] = useState(
    initialCustomerDetails
  );
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  async function handleSearch(event) {
    event.preventDefault();

    const searchTerm = medicineName.trim();

    setMessage("");
    setResults([]);
    setSelectedMedicine(null);
    setOrderSuccess("");

    if (!searchTerm) {
      setMessage("Please enter a medicine name.");
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 700));

      if (searchTerm.toLowerCase() === "paracetamol") {
        setResults(mockResults);
      } else {
        setMessage(`No pharmacies found for "${searchTerm}".`);
      }
    } catch (error) {
      console.error("Medicine search failed:", error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleOrderClick(result) {
    setSelectedMedicine(result);
    setOrderQuantity(1);
    setCustomerDetails(initialCustomerDetails);
    setOrderError("");
    setOrderSuccess("");
  }

  function handleCustomerChange(event) {
    const { name, value } = event.target;

    setCustomerDetails((currentDetails) => ({
      ...currentDetails,
      [name]: value,
    }));
  }

  function closeOrderForm() {
    setSelectedMedicine(null);
    setOrderQuantity(1);
    setOrderError("");
  }

  async function handleOrderSubmit(event) {
    event.preventDefault();

    setOrderError("");
    setOrderSuccess("");

    if (!selectedMedicine) {
      setOrderError("Please select a medicine before placing an order.");
      return;
    }

    if (!customerDetails.fullName.trim()) {
      setOrderError("Please enter your full name.");
      return;
    }

    if (!customerDetails.phoneNumber.trim()) {
      setOrderError("Please enter your phone number.");
      return;
    }

    if (!customerDetails.deliveryAddress.trim()) {
      setOrderError("Please enter your delivery address.");
      return;
    }

    if (
      orderQuantity < 1 ||
      orderQuantity > selectedMedicine.quantity
    ) {
      setOrderError(
        `Please enter a quantity between 1 and ${selectedMedicine.quantity}.`
      );
      return;
    }

    setIsSubmittingOrder(true);

    try {
      const order = {
        medicineName: selectedMedicine.medicineName,
        pharmacyId: selectedMedicine.pharmacyId,
        pharmacyName: selectedMedicine.pharmacyName,
        quantity: orderQuantity,
        unitPrice: selectedMedicine.price,
        totalPrice: selectedMedicine.price * orderQuantity,
        customer: {
          fullName: customerDetails.fullName.trim(),
          phoneNumber: customerDetails.phoneNumber.trim(),
          deliveryAddress: customerDetails.deliveryAddress.trim(),
        },
      };

      /*
       * Temporary mock order submission.
       * Replace this delay with a POST request when the backend is ready.
       */
      await new Promise((resolve) => setTimeout(resolve, 900));

      console.log("Mock order submitted:", order);

      const mockOrderReference = `MF-${Date.now()
        .toString()
        .slice(-6)}`;

      setOrderSuccess(
        `Order placed successfully. Your order reference is ${mockOrderReference}.`
      );

      setSelectedMedicine(null);
      setOrderQuantity(1);
      setCustomerDetails(initialCustomerDetails);
    } catch (error) {
      console.error("Order submission failed:", error);
      setOrderError("Your order could not be submitted. Please try again.");
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.searchSection}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Medicine search</p>
          <h1>Find and order medicine near you</h1>
          <p>
            Search for a medicine, choose an available pharmacy, and submit
            an order request.
          </p>
        </div>

        <form className={styles.searchForm} onSubmit={handleSearch}>
          <label htmlFor="medicineName">Medicine name</label>

          <div className={styles.searchControls}>
            <input
              id="medicineName"
              type="text"
              value={medicineName}
              onChange={(event) => setMedicineName(event.target.value)}
              placeholder="e.g. Paracetamol"
              autoComplete="off"
              disabled={isLoading}
            />

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>

          <p className={styles.helpText}>
            Try searching for Paracetamol.
          </p>
        </form>

        <div className={styles.statusArea} aria-live="polite">
          {isLoading && <p>Searching for available pharmacies...</p>}

          {!isLoading && message && (
            <div className={styles.messageBox} role="alert">
              <p>{message}</p>
            </div>
          )}

          {orderSuccess && (
            <div className={styles.successBox} role="status">
              <p>{orderSuccess}</p>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <section className={styles.resultsSection}>
            <div className={styles.resultsHeader}>
              <div>
                <p className={styles.eyebrow}>Search results</p>
                <h2>Available pharmacies</h2>
              </div>

              <p>
                {results.length} {results.length === 1 ? "result" : "results"}
              </p>
            </div>

            <div className={styles.resultsGrid}>
              {results.map((result) => (
                <article key={result.id} className={styles.resultCard}>
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.medicineName}>
                        {result.medicineName}
                      </p>
                      <h3>{result.pharmacyName}</h3>
                    </div>

                    <span className={styles.inStock}>In stock</span>
                  </div>

                  <div className={styles.cardDetails}>
                    <p>
                      <span>Location</span>
                      <strong>{result.location}</strong>
                    </p>

                    <p>
                      <span>Price</span>
                      <strong>₦{result.price.toLocaleString()}</strong>
                    </p>

                    <p>
                      <span>Quantity available</span>
                      <strong>{result.quantity}</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    className={styles.orderButton}
                    onClick={() => handleOrderClick(result)}
                  >
                    Place order
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {selectedMedicine && (
          <section className={styles.orderSection}>
            <div className={styles.orderHeader}>
              <div>
                <p className={styles.eyebrow}>Order request</p>
                <h2>Place your order</h2>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                onClick={closeOrderForm}
                aria-label="Close order form"
              >
                ×
              </button>
            </div>

            <div className={styles.orderSummary}>
              <p>
                <span>Medicine</span>
                <strong>{selectedMedicine.medicineName}</strong>
              </p>

              <p>
                <span>Pharmacy</span>
                <strong>{selectedMedicine.pharmacyName}</strong>
              </p>

              <p>
                <span>Unit price</span>
                <strong>
                  ₦{selectedMedicine.price.toLocaleString()}
                </strong>
              </p>
            </div>

            <form
              className={styles.orderForm}
              onSubmit={handleOrderSubmit}
            >
              <div className={styles.formGroup}>
                <label htmlFor="orderQuantity">Quantity</label>

                <input
                  id="orderQuantity"
                  type="number"
                  min="1"
                  max={selectedMedicine.quantity}
                  value={orderQuantity}
                  onChange={(event) =>
                    setOrderQuantity(Number(event.target.value))
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="fullName">Full name</label>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={customerDetails.fullName}
                  onChange={handleCustomerChange}
                  placeholder="Enter your full name"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phoneNumber">Phone number</label>

                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={customerDetails.phoneNumber}
                  onChange={handleCustomerChange}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="deliveryAddress">
                  Delivery address
                </label>

                <textarea
                  id="deliveryAddress"
                  name="deliveryAddress"
                  value={customerDetails.deliveryAddress}
                  onChange={handleCustomerChange}
                  placeholder="Enter your delivery address"
                  rows="4"
                />
              </div>

              <div className={styles.totalRow}>
                <span>Total</span>
                <strong>
                  ₦
                  {(
                    selectedMedicine.price * orderQuantity
                  ).toLocaleString()}
                </strong>
              </div>

              {orderError && (
                <div className={styles.messageBox} role="alert">
                  <p>{orderError}</p>
                </div>
              )}

              <button
                type="submit"
                className={styles.submitOrderButton}
                disabled={isSubmittingOrder}
              >
                {isSubmittingOrder
                  ? "Submitting order..."
                  : "Confirm order"}
              </button>
            </form>
          </section>
        )}
      </section>
    </main>
  );
}