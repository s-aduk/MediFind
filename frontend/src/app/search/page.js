"use client";

import { useState } from "react";
import styles from "./search.module.css";
import { searchMedicines, getPharmaciesForMedicine, placeOrder } from "@/lib/api";
import { isAuthenticated, getIdToken } from "@/lib/auth";

// Initial customer details for the order form
const initialCustomerDetails = {
  fullName: "",
  phoneNumber: "",
  deliveryAddress: "",
};

export default function SearchPage() {
  // ---------- State ----------
  const [medicineName, setMedicineName] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Order form state
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [customerDetails, setCustomerDetails] = useState(initialCustomerDetails);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // ---------- Search Handler ----------
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
      const data = await searchMedicines(searchTerm);

      if (data && data.length > 0) {
        // Transform backend response to match UI expectations
        const transformed = data.map((item, index) => ({
          id: index + 1,
          medicineId: item.medicineId,
          medicineName: item.name,
          genericName: item.genericName,
          strength: item.strength,
          pharmacyName: "Click to see pharmacies",
          pharmacyId: null,
          location: "—",
          price: 0,
          quantity: 0,
          // We'll fetch pharmacies when user clicks "View Pharmacies"
        }));
        setResults(transformed);
        setMessage("");
      } else {
        setMessage(`No medicines found for "${searchTerm}".`);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // ---------- Fetch Pharmacies for Selected Medicine ----------
  async function handleViewPharmacies(result) {
    // Reset any previous order state
    setSelectedMedicine(null);
    setOrderError("");
    setOrderSuccess("");

    setIsLoading(true);

    try {
      const pharmacies = await getPharmaciesForMedicine(result.medicineId);

      if (pharmacies && pharmacies.length > 0) {
        // For simplicity, we'll show the first pharmacy with stock
        // You could expand this to let the user choose among multiple.
        const pharmacy = pharmacies[0];
        setSelectedMedicine({
          ...result,
          pharmacyId: pharmacy.pharmacyId,
          pharmacyName: pharmacy.name,
          location: pharmacy.address || "Unknown",
          price: pharmacy.price,
          quantity: pharmacy.stock,
        });
        setOrderQuantity(1);
        setCustomerDetails(initialCustomerDetails);
        setOrderError("");
        setOrderSuccess("");
      } else {
        setOrderError("No pharmacies have this medicine in stock.");
      }
    } catch (error) {
      console.error("Failed to fetch pharmacies:", error);
      setOrderError("Could not fetch pharmacy information.");
    } finally {
      setIsLoading(false);
    }
  }

  // ---------- Close Order Form ----------
  function closeOrderForm() {
    setSelectedMedicine(null);
    setOrderQuantity(1);
    setOrderError("");
    setOrderSuccess("");
  }

  // ---------- Customer Details Change ----------
  function handleCustomerChange(event) {
    const { name, value } = event.target;
    setCustomerDetails((prev) => ({ ...prev, [name]: value }));
  }

  // ---------- Order Submission ----------
  async function handleOrderSubmit(event) {
    event.preventDefault();
    setOrderError("");
    setOrderSuccess("");

    // Validations
    if (!selectedMedicine) {
      setOrderError("Please select a medicine first.");
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
    if (orderQuantity < 1 || orderQuantity > selectedMedicine.quantity) {
      setOrderError(`Quantity must be between 1 and ${selectedMedicine.quantity}.`);
      return;
    }

    // Authentication check
    if (!isAuthenticated()) {
      setOrderError("Please log in to place an order.");
      return;
    }
    const idToken = getIdToken();
    if (!idToken) {
      setOrderError("Session expired. Please log in again.");
      return;
    }

    setIsSubmittingOrder(true);

    try {
      const orderData = {
        pharmacyId: selectedMedicine.pharmacyId,
        medicineId: selectedMedicine.medicineId,
        quantity: orderQuantity,
      };

      const result = await placeOrder(orderData, idToken);

      setOrderSuccess(`Order placed successfully! Order ID: ${result.orderId}`);
      // Clear the form after success
      setSelectedMedicine(null);
      setOrderQuantity(1);
      setCustomerDetails(initialCustomerDetails);
    } catch (error) {
      console.error("Order submission failed:", error);
      setOrderError(error.message || "Your order could not be submitted. Please try again.");
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  // ---------- Render ----------
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
              onChange={(e) => setMedicineName(e.target.value)}
              placeholder="e.g. Paracetamol"
              autoComplete="off"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
          <p className={styles.helpText}>Try searching for Paracetamol.</p>
        </form>

        {/* Status messages */}
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
          {orderError && (
            <div className={styles.messageBox} role="alert">
              <p>{orderError}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <section className={styles.resultsSection}>
            <div className={styles.resultsHeader}>
              <div>
                <p className={styles.eyebrow}>Search results</p>
                <h2>Available medicines</h2>
              </div>
              <p>{results.length} {results.length === 1 ? "result" : "results"}</p>
            </div>

            <div className={styles.resultsGrid}>
              {results.map((result) => (
                <article key={result.id} className={styles.resultCard}>
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.medicineName}>{result.medicineName}</p>
                      <h3>{result.pharmacyName}</h3>
                    </div>
                    <span className={styles.inStock}>In stock</span>
                  </div>

                  <div className={styles.cardDetails}>
                    <p>
                      <span>Generic</span>
                      <strong>{result.genericName || "—"}</strong>
                    </p>
                    <p>
                      <span>Strength</span>
                      <strong>{result.strength || "—"}</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    className={styles.orderButton}
                    onClick={() => handleViewPharmacies(result)}
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : "View Pharmacies"}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Order Form (shown when a pharmacy is selected) */}
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
                <strong>₦{selectedMedicine.price.toLocaleString()}</strong>
              </p>
              <p>
                <span>Available stock</span>
                <strong>{selectedMedicine.quantity}</strong>
              </p>
            </div>

            <form className={styles.orderForm} onSubmit={handleOrderSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="orderQuantity">Quantity</label>
                <input
                  id="orderQuantity"
                  type="number"
                  min="1"
                  max={selectedMedicine.quantity}
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Number(e.target.value))}
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
                <label htmlFor="deliveryAddress">Delivery address</label>
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
                  ₦{(selectedMedicine.price * orderQuantity).toLocaleString()}
                </strong>
              </div>

              <button
                type="submit"
                className={styles.submitOrderButton}
                disabled={isSubmittingOrder}
              >
                {isSubmittingOrder ? "Submitting order..." : "Confirm order"}
              </button>
            </form>
          </section>
        )}
      </section>
    </main>
  );
}