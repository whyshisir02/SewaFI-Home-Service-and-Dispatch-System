import { Inbox } from 'lucide-react';

const EmptyState = ({ message = 'No data available' }) => (
  <div className="text-center py-16">
    <Inbox className="w-16 h-16 mx-auto text-gray-300 mb-4" />
    <p className="text-gray-500 text-lg">{message}</p>
  </div>
);

export default EmptyState;