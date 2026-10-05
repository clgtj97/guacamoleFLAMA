import { Link } from 'react-router-dom';
import { ArrowDownTrayIcon, QrCodeIcon, ShareIcon } from '@heroicons/react/24/outline';

interface Invoice {
  id: string;
  amount: number;
  currency: 'BTC' | 'ETH' | 'USDT';
  status: 'paid' | 'pending' | 'expired' | 'cancelled';
  createdAt: string;
  dueDate: string;
  recipient: string;
  paymentAddress: string;
}

export function InvoiceTable() {
  const data: Invoice[] = [
    {
      id: 'INV-2023-001',
      amount: 0.005,
      currency: 'BTC',
      status: 'pending',
      createdAt: '2023-05-15T10:30:00Z',
      dueDate: '2023-05-22T10:30:00Z',
      recipient: 'John Doe',
      paymentAddress: '3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5',
    },
    {
      id: 'INV-2023-002',
      amount: 1.5,
      currency: 'ETH',
      status: 'paid',
      createdAt: '2023-05-14T08:15:00Z',
      dueDate: '2023-05-21T08:15:00Z',
      recipient: 'Jane Smith',
      paymentAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    },
    {
      id: 'INV-2023-003',
      amount: 150,
      currency: 'USDT',
      status: 'expired',
      createdAt: '2023-05-10T14:45:00Z',
      dueDate: '2023-05-17T14:45:00Z',
      recipient: 'Bob Johnson',
      paymentAddress: 'TYmkYYyQk1XZzLQYFQy7T7JKLZ7JwZz1J2',
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCryptoAmount = (amount: number, currency: string) => {
    return `${amount} ${currency}`;
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Invoices</h2>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
          Create New Invoice
        </button>
      </div>
      
      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recipient
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((invoice) => (
              <tr key={invoice.id} className="transition-colors hover:bg-gray-50/80">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-indigo-600">{invoice.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCryptoAmount(invoice.amount, invoice.currency)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{invoice.recipient}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[120px]">
                    {invoice.paymentAddress}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    invoice.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : invoice.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : invoice.status === 'expired'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(invoice.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(invoice.dueDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                    title="Download"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </button>
                  <button
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                    title="Show QR Code"
                  >
                    <QrCodeIcon className="h-5 w-5" />
                  </button>
                  <button
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                    title="Share"
                  >
                    <ShareIcon className="h-5 w-5" />
                  </button>
                  <Link
                    to={`/invoices/${invoice.id}`}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                    title="View Details"
                  >
                    <span className="text-sm">View</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="bg-white p-8 text-center text-gray-500">
            No invoices found. Create your first invoice to get started.
          </div>
        )}
      </div>
    </div>
  );
}