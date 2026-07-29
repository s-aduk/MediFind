import { render, screen } from '@testing-library/react';
import PharmacyCard from '../PharmacyCard';

const mockPharmacy = {
  pharmacy: {
    name: 'Test Pharmacy',
    address: '123 Main St',
  },
  price: 15.99,
  stock: 25,
  distance: 3.2,
  last_updated: '2024-01-15',
};

const mockOnOrder = jest.fn();

describe('PharmacyCard', () => {
  beforeEach(() => {
    mockOnOrder.mockClear();
  });

  it('renders pharmacy name and verified badge', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} onOrder={mockOnOrder} />);
    expect(screen.getByText('Test Pharmacy')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('renders pharmacy address', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} onOrder={mockOnOrder} />);
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });

  it('renders price correctly', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} onOrder={mockOnOrder} />);
    expect(screen.getByText('$15.99')).toBeInTheDocument();
  });

  it('renders stock status as in stock', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} onOrder={mockOnOrder} />);
    expect(screen.getByText('25 in stock')).toBeInTheDocument();
  });

  it('renders distance', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} onOrder={mockOnOrder} />);
    expect(screen.getByText('3.2 km')).toBeInTheDocument();
  });

  it('renders last updated date', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} onOrder={mockOnOrder} />);
    expect(screen.getByText('1/15/2024')).toBeInTheDocument();
  });

  it('shows Order Now button when in stock', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} onOrder={mockOnOrder} />);
    const button = screen.getByRole('button', { name: /order now/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('calls onOrder when Order Now clicked', () => {
    render(<PharmacyCard pharmacy={mockPharmacy} onOrder={mockOnOrder} />);
    const button = screen.getByRole('button', { name: /order now/i });
    button.click();
    expect(mockOnOrder).toHaveBeenCalledWith(mockPharmacy);
  });

  it('shows Out of Stock when stock is 0', () => {
    const outOfStockPharmacy = { ...mockPharmacy, stock: 0 };
    render(<PharmacyCard pharmacy={outOfStockPharmacy} onOrder={mockOnOrder} />);
    const button = screen.getByRole('button', { name: /out of stock/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('shows Out of Stock when quantity is used instead of stock', () => {
    const outOfStockPharmacy = { ...mockPharmacy, stock: undefined, quantity: 0 };
    render(<PharmacyCard pharmacy={outOfStockPharmacy} onOrder={mockOnOrder} />);
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });

  it('shows Price on request when price is missing', () => {
    const noPricePharmacy = { ...mockPharmacy, price: null };
    render(<PharmacyCard pharmacy={noPricePharmacy} onOrder={mockOnOrder} />);
    expect(screen.getByText('Price on request')).toBeInTheDocument();
  });
});