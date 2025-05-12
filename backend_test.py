import requests
import sys
import uuid
from datetime import datetime

class QRCodeAPITester:
    def __init__(self, base_url="https://534e6783-97da-4ef5-8618-1d6b0c318666.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = f"test_user_{uuid.uuid4().hex[:8]}"
        self.test_folder_id = None
        self.test_qr_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                print(f"Response: {response.json()}")
                return success, response.json()
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_create_folder(self, name):
        """Test creating a folder"""
        success, response = self.run_test(
            "Create Folder",
            "POST",
            "folders",
            200,
            data={"name": name, "user_id": self.test_user_id}
        )
        if success and 'id' in response:
            self.test_folder_id = response['id']
            return True
        return False

    def test_get_folders(self):
        """Test getting folders for a user"""
        success, _ = self.run_test(
            "Get Folders",
            "GET",
            f"folders/{self.test_user_id}",
            200
        )
        return success

    def test_create_qrcode(self, name, link):
        """Test creating a QR code"""
        success, response = self.run_test(
            "Create QR Code",
            "POST",
            "qrcodes",
            200,
            data={
                "name": name,
                "link": link,
                "folder_id": self.test_folder_id,
                "user_id": self.test_user_id
            }
        )
        if success and 'id' in response:
            self.test_qr_id = response['id']
            return True
        return False

    def test_get_qrcodes(self):
        """Test getting QR codes for a user"""
        success, _ = self.run_test(
            "Get QR Codes",
            "GET",
            f"qrcodes/{self.test_user_id}",
            200
        )
        return success

    def test_scan_qrcode(self):
        """Test scanning a QR code"""
        if not self.test_qr_id:
            print("❌ No QR code ID available for scan test")
            return False
            
        success, _ = self.run_test(
            "Scan QR Code",
            "POST",
            "qrcodes/scan",
            200,
            data={"qr_id": self.test_qr_id}
        )
        return success

    def test_get_total_scans(self):
        """Test getting total scan count"""
        success, _ = self.run_test(
            "Get Total Scans",
            "GET",
            f"total_scans/{self.test_user_id}",
            200
        )
        return success

def main():
    # Setup
    tester = QRCodeAPITester()
    
    # Run tests
    print(f"🧪 Running tests with test user ID: {tester.test_user_id}")
    
    # Test folder operations
    if not tester.test_create_folder("Test Folder"):
        print("❌ Folder creation failed, but continuing tests")
    
    if not tester.test_get_folders():
        print("❌ Getting folders failed, but continuing tests")
    
    # Test QR code operations
    if not tester.test_create_qrcode("Test QR", "https://example.com"):
        print("❌ QR code creation failed, but continuing tests")
    
    if not tester.test_get_qrcodes():
        print("❌ Getting QR codes failed, but continuing tests")
    
    if not tester.test_scan_qrcode():
        print("❌ QR code scanning failed, but continuing tests")
    
    if not tester.test_get_total_scans():
        print("❌ Getting total scans failed")
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())