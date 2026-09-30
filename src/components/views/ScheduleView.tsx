import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, MapPin, School, GraduationCap, Users, Plus } from 'lucide-react';
import { api } from '../../services/api';
import { ScheduleItem } from '../../types';
import { Badge } from '../common/Badge';

export const ScheduleView: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>('ALL');

  const DAYS = [
    'Dushanba',
    'Seshanba',
    'Chorshanba',
    'Payshanba',
    'Juma',
    'Shanba',
  ];

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.getSchedules();
      if (res.success) {
        setSchedules(res.data);
      }
    } catch (e) {
      console.error('Failed to load schedules:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const filteredDays = selectedDay === 'ALL' ? DAYS : [selectedDay];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Haftalik Dars Jadvali</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xonalar, guruhlar va pedagoglar kesimidagi to‘liq dars taqvimi
          </p>
        </div>

        {/* Day Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-xs text-xs">
          <button
            onClick={() => setSelectedDay('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              selectedDay === 'ALL'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Barchasi
          </button>
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                selectedDay === day
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Timetable by Day */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-3 border-orange-600/30 border-t-orange-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDays.map((day) => {
            const dayLessons = schedules
              .filter((s) => s.dayOfWeek.toLowerCase() === day.toLowerCase())
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div
                key={day}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col"
              >
                {/* Day Header (Deep Blue 30% Foundation) */}
                <div className="px-5 py-3.5 bg-[#0B1528] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-orange-400" />
                    <span className="font-bold text-sm tracking-tight">{day}</span>
                  </div>
                  <span className="text-[11px] font-mono text-orange-300 bg-blue-950/80 border border-blue-900 px-2 py-0.5 rounded">
                    {dayLessons.length} ta dars
                  </span>
                </div>

                {/* Day Lessons List */}
                <div className="p-4 space-y-3 flex-1">
                  {dayLessons.length > 0 ? (
                    dayLessons.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-orange-200 hover:bg-orange-50/20 transition-all text-xs space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900 text-sm group-hover:text-orange-600 transition-colors">
                            {item.groupName}
                          </span>
                          <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-orange-500" />
                            {item.startTime} - {item.endTime}
                          </span>
                        </div>

                        <div className="text-slate-600 font-medium">
                          {item.courseName}
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-slate-500 text-[11px]">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            {item.teacherName}
                          </span>

                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {item.room}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Bu kunda darslar rejalashtirilmagan
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
