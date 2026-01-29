import { Link } from "react-router-dom";
import { UserCircle } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center p-4 shadow">
      <h1 className="text-xl font-bold">PK Interiors</h1>

      <div className="flex gap-6 items-center">
        <Link to="/quotation">Create Quotation</Link>
        <Link to="/view">View Quotations</Link>
        <Link to="/login">
          <UserCircle size={28} />
        </Link>
      </div>
    </nav>
  );
}
