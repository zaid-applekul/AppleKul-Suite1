import React from 'react';
import { skaustSprayTemplate2026Chemicals, skaustSprayTemplate2026Programs, skaustSprayTemplate2026ProgramItems } from '../data/skaustSprayTemplate2026';
import { skaustActivityCalendar, skaustMonthNames } from '../data/skaustActivityCalendar';

const SkuastAdvisory: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f5f0] to-[#e6f4ea] py-10 px-2 flex justify-center items-start">
      <div className="w-full max-w-6xl flex flex-col gap-8 shadow-2xl rounded-2xl bg-white/80 border border-green-100 p-0 md:p-8 relative overflow-hidden book-effect">
        {/* Current Month Advisory - Full Width */}
        <div className="w-full text-center mb-4">
          <h2 className="text-2xl font-serif font-bold mb-4 text text-green-900 drop-shadow-sm tracking-wide">Current Month Advisory</h2>
          {(() => {
            const now = new Date();
             const currentMonthIdx = now.getMonth(); // 0-based
            const currentMonth = skaustActivityCalendar.find(m => m.month === currentMonthIdx + 1);
            if (!currentMonth) return <div className="text-gray-500">No advisory found for this month.</div>;
            return (
              <div className="rounded-2xl shadow-xl bg-green-50/80 border border-green-200 p-6 md:p-10 mb-8">
                <h3 className="text-2xl font-bold text-green-800 mb-4 text-center">{skaustMonthNames[currentMonthIdx]}</h3>
                <ul className="list-disc ml-6 text-base text-gray-800 space-y-2 text-center">
                  {currentMonth.activities.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            );
          })()}
          {/* Recommended Spray Treatments for This Month */}
          {(() => {
            const now = new Date();
            const currentMonthIdx = now.getMonth();
            // Map month index to program name (case-insensitive, partial match)
            const monthName = skaustMonthNames[currentMonthIdx];
            const monthPrograms = skaustSprayTemplate2026Programs.filter(p =>
              p.name.toLowerCase().includes(monthName.toLowerCase())
            );
            if (monthPrograms.length === 0) return null;
            return (
              <div className="rounded-2xl shadow-lg bg-gradient-to-br from-green-100/80 to-white/80 border border-green-200 p-6 md:p-8 mb-8">
                <h3 className="text-xl font-bold text-green-900 mb-4 text-center">Recommended Spray Treatments for {monthName}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-xs">
                    <thead>
                      <tr className="bg-green-100">
                        <th className="p-2 border">Program</th>
                        <th className="p-2 border">Stage</th>
                        <th className="p-2 border">Chemicals</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthPrograms.map((prog, i) => {
                        const items = skaustSprayTemplate2026ProgramItems.find(p => p.programName === prog.name)?.items || [];
                        return (
                          <tr key={i} className="even:bg-green-50/40">
                            <td className="p-2 border font-semibold text-green-900">{prog.name}</td>
                            <td className="p-2 border text-green-800">{prog.stage}</td>
                            <td className="p-2 border">
                              <ul className="list-disc ml-4">
                                {items.length === 0 ? <li>No chemicals listed</li> : items.map((item, j) => (
                                  <li key={j}>{item.chemicalName} <span className="text-green-700">({item.dose_rate} {item.dose_unit})</span></li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
        {/* Book Content: Spray Programs (all) */}
        <div className="w-full flex flex-col md:flex-row gap-8">
          {/* Left Page: All Spray Programs */}
          <div className="flex-1 p-6 md:p-8 border-r border-green-200 bg-white/90 book-left">
              <h1 className="text-3xl font-serif font-bold mb-6 text-green-900 drop-shadow-sm tracking-wide text-center">SKUAST Advisory <span className="text-lg font-normal text-green-700">2026</span></h1>
            <section>
                <h2 className="text-xl font-semibold mb-4 text-green-800 border-b border-green-200 pb-2 text-center">Spray Programs by Stage</h2>
              <div className="overflow-x-auto rounded-2xl shadow-lg bg-gradient-to-br from-green-50/80 to-white/80 border border-green-100">
                <table className="min-w-full border text-xs">
                  <thead>
                    <tr className="bg-green-100">
                      <th className="p-2 border">Program</th>
                      <th className="p-2 border">Stage</th>
                      <th className="p-2 border">Chemicals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skaustSprayTemplate2026Programs.map((prog, i) => {
                      const items = skaustSprayTemplate2026ProgramItems.find(p => p.programName === prog.name)?.items || [];
                      return (
                        <tr key={i} className="even:bg-green-50/40">
                          <td className="p-2 border font-semibold text-green-900">{prog.name}</td>
                          <td className="p-2 border text-green-800">{prog.stage}</td>
                          <td className="p-2 border">
                            <ul className="list-disc ml-4">
                              {items.length === 0 ? <li>No chemicals listed</li> : items.map((item, j) => (
                                <li key={j}>{item.chemicalName} <span className="text-green-700">({item.dose_rate} {item.dose_unit})</span></li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          {/* Book spine effect */}
          <div className="hidden md:block absolute top-[120px] bottom-0 left-1/2 w-2 bg-gradient-to-b from-green-200/60 to-green-100/0 z-10 rounded-full shadow-inner" style={{transform: 'translateX(-50%)'}} />
        </div>
      </div>
    </div>
  );
};

export default SkuastAdvisory;
