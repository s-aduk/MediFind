import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchMedicine from '../SearchMedicine';
import { searchMedicines } from '../../lib/api';

// Mock the API
jest.mock('../../lib/api', () => ({
  searchMedicines: jest.fn(),
}));

describe('SearchMedicine', () => {
  const mockOnSelect = jest.fn();
  const mockMedicines = [
    {
      pharmacyId: 'pharm1',
      pharmacy_id: 'pharm1',
      pharmacy: { name: 'Test Pharmacy', address: '123 Main St' },
      price: 10.99,
      stock: 50,
      distance: 2.5,
      last_updated: '2024-01-15',
    },
    {
      pharmacyId: 'pharm2',
      pharmacy: { name: 'Another Pharmacy', address: '456 Oak Ave' },
      price: 12.50,
      quantity: 30,
      distance: 5.1,
      updated_at: '2024-01-10',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (searchMedicines as jest.Mock).mockResolvedValue({ items: mockMedicines, count: 2 });
  });

  it('renders search input and button', () => {
    render(<SearchMedicine onSelectMedicine={mockOnSelect} />);
    expect(screen.getByPlaceholderText(/enter medicine name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search medicines/i })).toBeInTheDocument();
  });

  it('calls searchMedicines on form submit', async () => {
    render(<SearchMedicine onSelectMedicine={mockOnSelect} />);
    const input = screen.getByPlaceholderText(/enter medicine name/i);
    const button = screen.getByRole('button', { name: /search medicines/i });

    await userEvent.type(input, 'paracetamol');
    await userEvent.click(button);

    await waitFor(() => {
      expect(searchMedicines).toHaveBeenCalledWith('paracetamol');
    });
  });

  it('displays results after successful search', async () => {
    render(<SearchMedicine onSelectMedicine={mockOnSelect} />);
    const input = screen.getByPlaceholderText(/enter medicine name/i);
    const button = screen.getByRole('button', { name: /search medicines/i });

    await userEvent.type(input, 'amoxicillin');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/2 pharmacies found/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Test Pharmacy')).toBeInTheDocument();
    expect(screen.getByText('Another Pharmacy')).toBeInTheDocument();
    expect(screen.getByText('$10.99')).toBeInTheDocument();
    expect(screen.getByText('$12.50')).toBeInTheDocument();
  });

  it('shows empty state when no results found', async () => {
    (searchMedicines as jest.Mock).mockResolvedValue({ items: [], count: 0 });
    render(<SearchMedicine onSelectMedicine={mockOnSelect} />);

    const input = screen.getByPlaceholderText(/enter medicine name/i);
    const button = screen.getByRole('button', { name: /search medicines/i });

    await userEvent.type(input, 'nonexistent');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/no pharmacies found/i)).toBeInTheDocument();
    });
  });

  it('displays error message on API failure', async () => {
    (searchMedicines as jest.Mock).mockRejectedValue(new Error('Network error'));
    render(<SearchMedicine onSelectMedicine={mockOnSelect} />);

    const input = screen.getByPlaceholderText(/enter medicine name/i);
    const button = screen.getByRole('button', { name: /search medicines/i });

    await userEvent.type(input, 'test');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('calls onSelectMedicine when order button clicked', async () => {
    render(<SearchMedicine onSelectMedicine={mockOnSelect} />);
    const input = screen.getByPlaceholderText(/enter medicine name/i);
    const button = screen.getByRole('button', { name: /search medicines/i });

    await userEvent.type(input, 'ibuprofen');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /order now/i })).toBeInTheDocument();
    });

    const orderButton = screen.getByRole('button', { name: /order now/i });
    await userEvent.click(orderButton);

    expect(mockOnSelect).toHaveBeenCalledWith(mockMedicines[0]);
  });

  it('disables order button when out of stock', async () => {
    (searchMedicines as jest.Mock).mockResolvedValue({
      items: [
        {
          pharmacyId: 'pharm1',
          pharmacy: { name: 'Test Pharmacy', address: '123 Main St' },
          price: 10.99,
          stock: 0,
          distance: 2.5,
        },
      ],
      count: 1,
    });

    render(<SearchMedicine onSelectMedicine={mockOnSelect} />);
    const input = screen.getByPlaceholderText(/enter medicine name/i);
    const button = screen.getByRole('button', { name: /search medicines/i });

    await userEvent.type(input, 'test');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /out of stock/i })).toBeDisabled();
    });
  });
});