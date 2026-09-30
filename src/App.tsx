/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { LoginView } from './components/views/LoginView';
import { DashboardView } from './components/views/DashboardView';
import { StudentsView } from './components/views/StudentsView';
import { GroupsView } from './components/views/GroupsView';
import { TeachersView } from './components/views/TeachersView';
import { CoursesView } from './components/views/CoursesView';
import { AttendanceView } from './components/views/AttendanceView';
import { PaymentsView } from './components/views/PaymentsView';
import { ScheduleView } from './components/views/ScheduleView';
import { ReportsView } from './components/views/ReportsView';
import { UsersView } from './components/views/UsersView';
import { AuditLogsView } from './components/views/AuditLogsView';
import { SettingsView } from './components/views/SettingsView';
import { AddStudentModal } from './components/views/AddStudentModal';
import { StudentDetailModal } from './components/views/StudentDetailModal';
import { ParentPortalView } from './components/views/ParentPortalView';
import { initFirebaseService } from './services/firebaseService';

function MainApp() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const isTeacher = user?.role === 'TEACHER';

  useEffect(() => {
    initFirebaseService();
  }, []);

  const [currentTab, setCurrentTab] = useState<NavigationTab>(() => {
    return isTeacher ? 'attendance' : 'dashboard';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Strictly keep teacher on attendance view
  React.useEffect(() => {
    if (isTeacher && currentTab !== 'attendance') {
      setCurrentTab('attendance');
    }
  }, [isTeacher, currentTab]);

  // Global Student Modals
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);
  const [studentForPayment, setStudentForPayment] = useState<any | null>(null);
  const [attendanceGroupId, setAttendanceGroupId] = useState<string | undefined>(undefined);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070F1E] flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-orange-200">EduCenter CRM yuklanmoqda...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Strictly route Parent/Student role to Parent Portal
  if (user?.role === 'PARENT') {
    return <ParentPortalView />;
  }

  const handleOpenStudentDetail = (id: string) => {
    if (isTeacher) return;
    setDetailStudentId(id);
  };

  const handleOpenAddPaymentForStudent = (student: any) => {
    if (isTeacher) return;
    setStudentForPayment(student);
    setCurrentTab('payments');
  };

  const handleNavigateToAttendance = (groupId: string) => {
    setAttendanceGroupId(groupId);
    setCurrentTab('attendance');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F4] text-slate-900 font-sans flex">
      {/* Sidebar */}
      <Sidebar
        currentTab={isTeacher ? 'attendance' : currentTab}
        onTabChange={(tab) => {
          if (isTeacher) {
            setCurrentTab('attendance');
            return;
          }
          setCurrentTab(tab);
          setAttendanceGroupId(undefined);
        }}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Topbar
          onMobileMenuToggle={() => setIsMobileSidebarOpen(true)}
          currentTab={isTeacher ? 'attendance' : currentTab}
          onOpenQuickAddStudent={!isTeacher ? () => setIsAddStudentOpen(true) : undefined}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isTeacher ? (
            <AttendanceView initialGroupId={attendanceGroupId} />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  onNavigate={(tab) => setCurrentTab(tab)}
                  onOpenAddStudent={() => setIsAddStudentOpen(true)}
                />
              )}

              {currentTab === 'students' && (
                <StudentsView
                  onOpenAddStudent={() => setIsAddStudentOpen(true)}
                  onOpenStudentDetail={handleOpenStudentDetail}
                  onOpenAddPaymentForStudent={handleOpenAddPaymentForStudent}
                />
              )}

              {currentTab === 'groups' && (
                <GroupsView
                  onOpenStudentDetail={handleOpenStudentDetail}
                  onNavigateToAttendanceWithGroup={handleNavigateToAttendance}
                />
              )}

              {currentTab === 'teachers' && <TeachersView />}

              {currentTab === 'courses' && <CoursesView />}

              {currentTab === 'attendance' && (
                <AttendanceView initialGroupId={attendanceGroupId} />
              )}

              {currentTab === 'payments' && (
                <PaymentsView
                  initialStudentForPayment={studentForPayment}
                  onOpenStudentDetail={handleOpenStudentDetail}
                />
              )}

              {currentTab === 'schedule' && <ScheduleView />}

              {currentTab === 'reports' && <ReportsView />}

              {currentTab === 'users' && <UsersView />}

              {currentTab === 'audit' && <AuditLogsView />}

              {currentTab === 'settings' && <SettingsView />}
            </>
          )}
        </main>
      </div>

      {/* Global Add Student Modal */}
      {!isTeacher && (
        <AddStudentModal
          isOpen={isAddStudentOpen}
          onClose={() => setIsAddStudentOpen(false)}
          onSuccess={() => {
            window.dispatchEvent(new CustomEvent('crm:student-created'));
          }}
        />
      )}

      {/* Global Student Profile Detail Modal */}
      {!isTeacher && (
        <StudentDetailModal
          studentId={detailStudentId}
          isOpen={Boolean(detailStudentId)}
          onClose={() => setDetailStudentId(null)}
          onRefreshList={() => {
            window.dispatchEvent(new CustomEvent('crm:student-created'));
          }}
          onOpenAddPaymentForStudent={handleOpenAddPaymentForStudent}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
