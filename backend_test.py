import requests
import sys
from datetime import datetime
import json

class EmployeeManagementTester:
    def __init__(self, base_url="https://emp-hub-10.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.employee_token = None
        self.employee_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, cookies=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers, cookies=cookies)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers, cookies=cookies)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers, cookies=cookies)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": "admin@company.com", "password": "admin123"}
        )
        if success and response.get('role') == 'admin':
            print(f"   Admin user: {response.get('name')} ({response.get('email')})")
            return True
        return False

    def test_admin_dashboard_stats(self):
        """Test admin dashboard data endpoints"""
        endpoints = [
            ("Get Employees", "api/employees"),
            ("Get All Attendance", "api/attendance"),
            ("Get All Leaves", "api/leaves"),
            ("Get Payroll", "api/payroll")
        ]
        
        all_passed = True
        for name, endpoint in endpoints:
            success, _ = self.run_test(name, "GET", endpoint, 200)
            if not success:
                all_passed = False
        
        return all_passed

    def test_create_employee(self):
        """Test creating a new employee"""
        timestamp = datetime.now().strftime("%H%M%S")
        employee_data = {
            "name": f"Test Employee {timestamp}",
            "email": f"test.employee.{timestamp}@company.com",
            "salary": 50000,
            "position": "Software Developer"
        }
        
        success, response = self.run_test(
            "Create Employee",
            "POST",
            "api/employees",
            200,
            data=employee_data
        )
        
        if success and response.get('_id'):
            self.employee_id = response['_id']
            print(f"   Created employee ID: {self.employee_id}")
            return True, employee_data['email']
        return False, None

    def test_employee_login(self, email):
        """Test employee login"""
        success, response = self.run_test(
            "Employee Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": email, "password": "employee123"}
        )
        if success and response.get('role') == 'employee':
            print(f"   Employee user: {response.get('name')} ({response.get('email')})")
            return True
        return False

    def test_employee_attendance(self):
        """Test employee attendance check-in/out"""
        # Test check-in
        success1, _ = self.run_test(
            "Employee Check-in",
            "POST",
            "api/attendance/checkin",
            200
        )
        
        # Test check-out
        success2, _ = self.run_test(
            "Employee Check-out",
            "POST",
            "api/attendance/checkout",
            200
        )
        
        # Test get my attendance
        success3, _ = self.run_test(
            "Get My Attendance",
            "GET",
            "api/attendance/me",
            200
        )
        
        return success1 and success2 and success3

    def test_employee_leave_flow(self):
        """Test employee leave application and admin approval"""
        # Apply for leave
        leave_data = {
            "start_date": "2024-12-25",
            "end_date": "2024-12-26",
            "reason": "Christmas holidays"
        }
        
        success1, leave_response = self.run_test(
            "Apply for Leave",
            "POST",
            "api/leaves",
            200,
            data=leave_data
        )
        
        if not success1:
            return False
        
        leave_id = leave_response.get('_id')
        print(f"   Applied leave ID: {leave_id}")
        
        # Get my leaves
        success2, _ = self.run_test(
            "Get My Leaves",
            "GET",
            "api/leaves/me",
            200
        )
        
        # Admin approve leave (need to switch back to admin session)
        success3, _ = self.run_test(
            "Admin Approve Leave",
            "POST",
            f"api/leaves/{leave_id}/approve",
            200
        )
        
        return success1 and success2 and success3

    def test_payroll_and_notifications(self):
        """Test payroll processing and notifications"""
        # Run payroll
        success1, _ = self.run_test(
            "Run Payroll",
            "POST",
            "api/payroll/run",
            200
        )
        
        # Get employee salary records
        success2, _ = self.run_test(
            "Get My Salary",
            "GET",
            "api/salary/me",
            200
        )
        
        # Get notifications
        success3, _ = self.run_test(
            "Get My Notifications",
            "GET",
            "api/notifications/me",
            200
        )
        
        return success1 and success2 and success3

    def test_logout(self):
        """Test logout functionality"""
        success, _ = self.run_test(
            "Logout",
            "POST",
            "api/auth/logout",
            200
        )
        return success

def main():
    print("🚀 Starting Employee Management System API Tests")
    print("=" * 60)
    
    tester = EmployeeManagementTester()
    
    # Test admin login
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        return 1
    
    # Test admin dashboard endpoints
    if not tester.test_admin_dashboard_stats():
        print("❌ Admin dashboard endpoints failed")
        return 1
    
    # Test employee creation
    employee_created, employee_email = tester.test_create_employee()
    if not employee_created:
        print("❌ Employee creation failed")
        return 1
    
    # Test employee login
    if not tester.test_employee_login(employee_email):
        print("❌ Employee login failed")
        return 1
    
    # Test employee attendance
    if not tester.test_employee_attendance():
        print("❌ Employee attendance flow failed")
    
    # Test leave application and approval flow
    if not tester.test_employee_leave_flow():
        print("❌ Leave application/approval flow failed")
    
    # Test payroll and notifications
    if not tester.test_payroll_and_notifications():
        print("❌ Payroll and notifications failed")
    
    # Test logout
    if not tester.test_logout():
        print("❌ Logout failed")
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run}")
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("✅ Backend API tests mostly successful")
        return 0
    else:
        print("❌ Backend API tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())