'use client';
import { useEffect, useState } from 'react';
import { useLiveBookings } from '../hooks/useWebSockets';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Activity, CheckCircle2, Clock, Search, Wrench, LayoutDashboard, Settings2 } from "lucide-react";

// The categories must match what your Python seed script generated
const SERVICE_CATEGORIES = [
  'All Services',
  'Oil Change',
  'Brake Inspection',
  'Engine Diagnostics',
  'Tire Rotation',
  'Battery Replacement'
];

export default function Dashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState('All Services');
  const liveEvent = useLiveBookings();

  useEffect(() => {
    fetch(`http://localhost:8000/api/bookings?page=${page}&limit=10`)
      .then(res => res.json())
      .then(data => {
        setBookings(data.data);
        setTotalBookings(data.total);
        setTotalPages(data.total_pages);
      });
  }, [page]);

  useEffect(() => {
    if (liveEvent) {
      setBookings(currentBookings => 
        currentBookings.map(booking => 
          booking.booking_id === liveEvent.booking_id 
            ? { ...booking, status: liveEvent.status } 
            : booking
        )
      );
    }
  }, [liveEvent]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Mechanic On The Way': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Double Filter: Checks BOTH the search bar AND the selected sidebar tab
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          booking.booking_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesService = selectedService === 'All Services' || booking.service === selectedService;
    return matchesSearch && matchesService;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-2">
          <Wrench className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold tracking-tight">Instant Mechanic <span className="text-slate-400 font-normal">| Live Ops</span></h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>System Live</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Service Categories */}
        <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 hidden md:block overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3">Service Groups</h2>
            <nav className="space-y-1">
              {SERVICE_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedService(category)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    selectedService === category 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {category === 'All Services' ? <LayoutDashboard className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
                  <span>{category}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Area (Your existing UI) */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          
          <div className="flex items-center justify-between">
             <h2 className="text-2xl font-semibold text-slate-800">{selectedService}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total Database Records</CardTitle>
                <Activity className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalBookings}</div>
                <p className="text-xs text-slate-400 mt-1">Across all time</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Filtered View</CardTitle>
                <Clock className="w-4 h-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{filteredBookings.length}</div>
                <p className="text-xs text-slate-400 mt-1">Matching search & category</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Completed (Filtered)</CardTitle>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {filteredBookings.filter(b => b.status === 'Completed').length}
                </div>
                <p className="text-xs text-slate-400 mt-1">Successfully serviced</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by Booking ID or Customer..." 
                className="pl-9 w-full bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-4 text-sm font-medium">
              <button 
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors">
                Previous
              </button>
              <span className="text-slate-500">Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors">
                Next
              </button>
            </div>
          </div>

          <Card className="shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-600">Booking ID</TableHead>
                  <TableHead className="font-semibold text-slate-600">Customer</TableHead>
                  <TableHead className="font-semibold text-slate-600">Service</TableHead>
                  <TableHead className="font-semibold text-slate-600 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                      No bookings found for this category or search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.booking_id} className="hover:bg-slate-50 transition-colors group cursor-pointer border-b border-slate-100 last:border-0">
                      <TableCell className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                        {booking.booking_id}
                      </TableCell>
                      <TableCell className="text-slate-600">{booking.customer?.name}</TableCell>
                      <TableCell className="text-slate-600">{booking.service}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={`${getStatusColor(booking.status)} shadow-none font-medium px-2.5 py-0.5`}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </main>
      </div>
    </div>
  );
}