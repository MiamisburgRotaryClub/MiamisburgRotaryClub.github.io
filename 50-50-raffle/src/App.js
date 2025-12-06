import React, { useState, useEffect } from 'react';
import { Ticket, Award, Mail, MessageSquare, Copy, Check } from 'lucide-react';

const RotaryGear = ({ className = "w-12 h-12" }) => {
  const teeth = [];
  const spokes = [];
  
  for (let i = 0; i < 24; i++) {
    const angle = (i * 15) * Math.PI / 180;
    const x1 = Math.cos(angle) * 85;
    const y1 = Math.sin(angle) * 85;
    const x2 = Math.cos(angle) * 95;
    const y2 = Math.sin(angle) * 95;
    teeth.push(<line key={`t${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F7A81B" strokeWidth="8"/>);
  }
  
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60) * Math.PI / 180;
    const x = Math.cos(angle) * 70;
    const y = Math.sin(angle) * 70;
    spokes.push(<line key={`s${i}`} x1="0" y1="0" x2={x} y2={y} stroke="#F7A81B" strokeWidth="25"/>);
  }

  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(100, 100)">
        {teeth}
        <circle cx="0" cy="0" r="85" fill="#F7A81B"/>
        <circle cx="0" cy="0" r="75" fill="white"/>
        {spokes}
        <circle cx="0" cy="0" r="20" fill="#F7A81B"/>
        <circle cx="0" cy="0" r="15" fill="white"/>
        <circle cx="0" cy="0" r="10" fill="#F7A81B"/>
        <text x="0" y="-55" textAnchor="middle" fill="#F7A81B" fontSize="20" fontWeight="bold">ROTARY</text>
      </g>
    </svg>
  );
};

function App() {
  const [view, setView] = useState('home');
  const [stats, setStats] = useState({ totalFunds: 0, split: 0, ticketsSold: 0, lastTicketNumber: 0 });
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', ticketCount: '', paymentMethod: 'cash' });
  const [receipt, setReceipt] = useState(null);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState(null);

  // Backend Web App URL from Google Apps Script deployment
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyTVxqYslU4NJbsehqU9Bgc0nzeQ1hAgeiFCZJdFKR5AILFshTRzRomb-batsvgGTHrrw/exec'; // <-- paste your real URL here


  const calculatePrice = (tickets) => {
    const num = parseInt(tickets) || 0;
    const sixPacks = Math.floor(num / 6);
    const singles = num % 6;
    return (sixPacks * 5) + singles;
  };

  const calculateBreakdown = (tickets) => {
    const num = parseInt(tickets) || 0;
    const sixPacks = Math.floor(num / 6);
    const singles = num % 6;
    let breakdown = [];
    if (sixPacks > 0) breakdown.push(`${sixPacks} six-pack${sixPacks > 1 ? 's' : ''} (${sixPacks * 6} tickets) = $${sixPacks * 5}`);
    if (singles > 0) breakdown.push(`${singles} single ticket${singles > 1 ? 's' : ''} = $${singles}`);
    return breakdown;
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${SCRIPT_URL}?action=stats`);
      const data = await response.json();
      if (data.success) {
        setStats({
          totalFunds: data.totalFunds,
          split: data.split,
          ticketsSold: data.ticketsSold,
          lastTicketNumber: data.lastTicketNumber,
        });
      } else {
        console.error('Error loading stats:', data.error);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };


  useEffect(() => { loadStats(); }, []);

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.ticketCount) {
      alert('Please fill in all fields');
      return;
    }
    const ticketCount = parseInt(formData.ticketCount);
    const totalPaid = calculatePrice(ticketCount);
    setPendingRegistration({ name: formData.name, email: formData.email, phone: formData.phone, ticketCount, totalPaid, paymentMethod: formData.paymentMethod });
    setAwaitingPayment(true);
  };

const confirmPayment = async () => {
  if (!pendingRegistration) return;

  setLoading(true);
  try {
    const { name, email, phone, ticketCount, totalPaid, paymentMethod } = pendingRegistration;

    const params = new URLSearchParams({
      action: 'register',
      name,
      email,
      phone,
      ticketCount: String(ticketCount),
      totalPaid: String(totalPaid),
      paymentMethod,
    });

    const response = await fetch(`${SCRIPT_URL}?${params.toString()}`);
    const data = await response.json();

    if (!data.success) {
      console.error('Error from backend:', data.error);
      alert('Error submitting registration. Please try again.');
      setLoading(false);
      return;
    }

    const { totalFunds, ticketsSold, lastTicketNumber, split, ticketNumbers } = data;

    const newReceipt = {
      name,
      email,
      phone,
      tickets: ticketCount,
      ticketNumbers,
      totalPaid,
      paymentMethod,
    };

    setStats({
      totalFunds,
      ticketsSold,
      lastTicketNumber,
      split,
    });

    setReceipt(newReceipt);
    setView('receipt');
    setAwaitingPayment(false);
    setPendingRegistration(null);
    setFormData({ name: '', email: '', phone: '', ticketCount: '', paymentMethod: 'cash' });
  } catch (error) {
    console.error('Error submitting:', error);
    alert('Error submitting registration. Please try again.');
  } finally {
    setLoading(false);
  }
};

const drawWinner = async () => {
  setLoading(true);
  try {
    const response = await fetch(`${SCRIPT_URL}?action=draw`);
    const data = await response.json();

    if (!data.success) {
      alert(data.error || 'Error drawing winner. Please try again.');
      setLoading(false);
      return;
    }

    setWinner({
      ticketNumber: data.ticketNumber,
      name: data.name,
      email: data.email,
      phone: data.phone,
      totalFunds: data.totalFunds,
      split: data.split,
    });
    setView('winner');
  } catch (error) {
    console.error('Error drawing winner:', error);
    alert('Error drawing winner. Please try again.');
  } finally {
    setLoading(false);
  }
};


  const formatReceiptText = () => `Miamisburg Rotary Club
===========================
*** 50/50 Raffle Receipt ***
---------------------------
Name: ${receipt.name}
Tickets: ${receipt.tickets}
Ticket Numbers: ${receipt.ticketNumbers.join(', ')}
Total Paid: $${receipt.totalPaid}
Payment Method: ${receipt.paymentMethod.toUpperCase()}
===========================
Thank you for supporting our cause!`;

  const sendEmail = () => {
    const subject = encodeURIComponent('Miamisburg Rotary 50/50 Raffle Receipt');
    const body = encodeURIComponent(formatReceiptText());
    window.location.href = `mailto:${receipt.email}?subject=${subject}&body=${body}`;
  };

  const sendText = () => {
    window.location.href = `sms:${receipt.phone}?body=${encodeURIComponent(formatReceiptText())}`;
  };

  const copyReceipt = () => {
    navigator.clipboard.writeText(formatReceiptText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (view === 'home') {
    return (
      <div className="min-h-screen p-4" style={{ background: '#01357C' }}>
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 mb-4">
            <div className="flex items-center justify-center mb-4">
              <RotaryGear className="w-16 h-16 mr-3" />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#01357C' }}>Miamisburg Rotary</h1>
                <p className="text-sm" style={{ color: '#F7A81B' }}>50/50 Raffle</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-xl p-6 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#F7A81B20' }}>
                <p className="text-sm text-gray-600 mb-1">Total Collected</p>
                <p className="text-2xl font-bold" style={{ color: '#01357C' }}>${stats.totalFunds}</p>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#F7A81B20' }}>
                <p className="text-sm text-gray-600 mb-1">50/50 Split</p>
                <p className="text-2xl font-bold" style={{ color: '#01357C' }}>${stats.split}</p>
              </div>
              <div className="text-center p-4 rounded-lg col-span-2" style={{ backgroundColor: '#F7A81B20' }}>
                <p className="text-sm text-gray-600 mb-1">Tickets Sold</p>
                <p className="text-2xl font-bold" style={{ color: '#01357C' }}>{stats.ticketsSold}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <button onClick={() => setView('register')} className="w-full text-white font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center space-x-2 transition hover:opacity-90" style={{ backgroundColor: '#F7A81B' }}>
              <Ticket className="w-6 h-6" />
              <span>Register Tickets</span>
            </button>
            <button onClick={drawWinner} disabled={loading} className="w-full bg-white font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center space-x-2 transition hover:opacity-90 disabled:opacity-50" style={{ color: '#01357C' }}>
              <Award className="w-6 h-6" />
              <span>{loading ? 'Drawing...' : 'Draw Winner'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'register') {
    const ticketCount = parseInt(formData.ticketCount) || 0;
    const totalCost = calculatePrice(ticketCount);
    const breakdown = calculateBreakdown(ticketCount);

    return (
      <div className="min-h-screen p-4" style={{ background: '#01357C' }}>
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex items-center mb-4">
              <RotaryGear className="w-10 h-10 mr-3" />
              <h2 className="text-2xl font-bold" style={{ color: '#01357C' }}>Register Tickets</h2>
            </div>
            <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: '#F7A81B20' }}>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Total Collected:</span>
                <span className="font-bold" style={{ color: '#01357C' }}>${stats.totalFunds}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">50/50 Split:</span>
                <span className="font-bold" style={{ color: '#01357C' }}>${stats.split}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Enter name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="(555) 555-5555" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Tickets</label>
                <input type="number" value={formData.ticketCount} onChange={(e) => setFormData({...formData, ticketCount: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Enter number" min="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'cash'})} className={`py-3 px-4 rounded-lg font-medium transition ${formData.paymentMethod === 'cash' ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} style={formData.paymentMethod === 'cash' ? { backgroundColor: '#F7A81B' } : {}}>💵 Cash</button>
                  <button type="button" onClick={() => setFormData({...formData, paymentMethod: 'venmo'})} className={`py-3 px-4 rounded-lg font-medium transition ${formData.paymentMethod === 'venmo' ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} style={formData.paymentMethod === 'venmo' ? { backgroundColor: '#3D95CE' } : {}}>📱 Venmo</button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">💰 Pricing: $1 each or 6 for $5</p>
                {ticketCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="font-medium text-gray-700 mb-2">Price Breakdown:</p>
                    {breakdown.map((line, i) => (<p key={i} className="text-sm text-gray-600">• {line}</p>))}
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">Total:</span>
                        <span className="font-bold text-2xl" style={{ color: '#01357C' }}>${totalCost}</span>
                      </div>
                    </div>
                    {formData.paymentMethod === 'venmo' && (
                      <div className="mt-4 pt-4 border-t border-gray-300 text-center">
                        <p className="text-sm font-medium text-gray-700 mb-3">Scan to Pay with Venmo:</p>
                        <div className="bg-white p-4 rounded-lg inline-block shadow-sm">
                          <img 
                            src="/50-50-raffle/live/venmo-qr.png"
                            alt="Venmo QR Code"
                            className="w-48 h-48 mx-auto"
                          />
                        </div>
                        <p className="mt-3 text-sm font-bold text-gray-700">Payment Note: "Raffle"</p>
                        <p className="text-xs text-gray-500 mt-1">(Verification code 4872 if prompted)</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <button onClick={handleSubmit} className="w-full text-white font-bold py-3 px-6 rounded-lg transition hover:opacity-90" style={{ backgroundColor: '#F7A81B' }}>Continue to Payment</button>
              <button onClick={() => setView('home')} className="w-full font-bold py-3 px-6 rounded-lg transition hover:opacity-90" style={{ backgroundColor: '#01357C', color: 'white' }}>Cancel</button>
            </div>
          </div>
        </div>
        {awaitingPayment && pendingRegistration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#F7A81B20' }}>
                  <span className="text-4xl">{pendingRegistration.paymentMethod === 'cash' ? '💵' : '📱'}</span>
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: '#01357C' }}>Awaiting Payment</h3>
                <p className="text-gray-600">{pendingRegistration.paymentMethod === 'cash' ? 'Collect cash payment from customer' : 'Wait for Venmo payment confirmation'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex justify-between"><span className="text-gray-700">Customer:</span><span className="font-bold">{pendingRegistration.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-700">Tickets:</span><span className="font-bold">{pendingRegistration.ticketCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-700">Payment Method:</span><span className="font-bold capitalize">{pendingRegistration.paymentMethod}</span></div>
                <div className="flex justify-between pt-2 border-t-2 border-gray-300"><span className="text-lg font-bold">Amount Due:</span><span className="text-2xl font-bold" style={{ color: '#F7A81B' }}>${pendingRegistration.totalPaid}</span></div>
              </div>
              <div className="space-y-3">
                <button onClick={confirmPayment} disabled={loading} className="w-full text-white font-bold py-3 px-6 rounded-lg transition hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#F7A81B' }}>{loading ? 'Processing...' : '✓ Payment Received - Complete Registration'}</button>
                <button onClick={() => { setAwaitingPayment(false); setPendingRegistration(null); }} disabled={loading} className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition disabled:opacity-50">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'receipt') {
    return (
      <div className="min-h-screen p-4" style={{ background: '#01357C' }}>
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="text-center mb-6">
              <Check className="w-16 h-16 mx-auto mb-2" style={{ color: '#F7A81B' }} />
              <h2 className="text-2xl font-bold" style={{ color: '#01357C' }}>Registration Complete!</h2>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 mb-6 font-mono text-sm">
              <pre className="whitespace-pre-wrap text-center">{formatReceiptText()}</pre>
            </div>
            <p className="text-center text-gray-700 mb-4 font-medium">Send Receipt To Customer?</p>
            <div className="space-y-3">
              <button onClick={sendEmail} className="w-full text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition hover:opacity-90" style={{ backgroundColor: '#01357C' }}><Mail className="w-5 h-5" /><span>Send via Email</span></button>
              <button onClick={sendText} className="w-full text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition hover:opacity-90" style={{ backgroundColor: '#F7A81B' }}><MessageSquare className="w-5 h-5" /><span>Send via Text</span></button>
              <button onClick={copyReceipt} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition"><Copy className="w-5 h-5" /><span>{copied ? 'Copied!' : 'Copy Receipt'}</span></button>
              <button onClick={() => setView('home')} className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition">Done</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'winner') {
    return (
      <div className="min-h-screen p-4" style={{ background: '#01357C' }}>
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="text-center mb-6">
              <RotaryGear className="w-20 h-20 mx-auto mb-4 animate-bounce" />
              <h2 className="text-3xl font-bold mb-2" style={{ color: '#01357C' }}>🎉 50/50 Raffle Winner 🎉</h2>
            </div>
            <div className="rounded-lg p-6 mb-6 border-4" style={{ backgroundColor: '#F7A81B20', borderColor: '#F7A81B' }}>
              <div className="space-y-4">
                <div className="text-center py-4 bg-white rounded-lg shadow">
                  <p className="text-sm text-gray-600 mb-1">Winning Ticket</p>
                  <p className="text-4xl font-bold" style={{ color: '#F7A81B' }}>#{winner.ticketNumber}</p>
                </div>
                <div className="border-t-2 border-dashed pt-4" style={{ borderColor: '#F7A81B' }}>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-gray-700 font-medium">Name:</span><span className="font-bold">{winner.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-700 font-medium">Email:</span><span className="font-bold text-sm">{winner.email}</span></div>
                    <div className="flex justify-between"><span className="text-gray-700 font-medium">Phone:</span><span className="font-bold">{winner.phone}</span></div>
                  </div>
                </div>
                <div className="border-t-2 border-dashed pt-4" style={{ borderColor: '#F7A81B' }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg shadow">
                      <p className="text-xs text-gray-600 mb-1">Total Collected</p>
                      <p className="text-xl font-bold" style={{ color: '#01357C' }}>${winner.totalFunds}</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg shadow">
                      <p className="text-xs text-gray-600 mb-1">Winner Gets</p>
                      <p className="text-xl font-bold" style={{ color: '#F7A81B' }}>${winner.split}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-gray-600 mb-6 italic">Thank you to all participants for supporting our cause!</p>
            <button onClick={() => setView('home')} className="w-full text-white font-bold py-3 px-6 rounded-lg transition hover:opacity-90" style={{ backgroundColor: '#01357C' }}>Back to Home</button>
          </div>
        </div>
      </div>
    );
  }
}

export default App;