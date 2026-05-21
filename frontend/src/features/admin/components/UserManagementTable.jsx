import { Card } from '../../../components/ui/Layout/Card';

export function UserManagementTable({ users = [] }) {
  return (
    <Card className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-muted">
          <tr>
            <th className="py-2">Name</th>
            <th className="py-2">Role</th>
            <th className="py-2">Email</th>
            <th className="py-2">District</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t border-border">
              <td className="py-3 text-foreground">{user.name}</td>
              <td className="py-3 text-muted">{user.role}</td>
              <td className="py-3 text-muted">{user.email}</td>
              <td className="py-3 text-muted">{user.district}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export default UserManagementTable;
