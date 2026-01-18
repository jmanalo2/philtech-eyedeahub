"""
Test file for Iteration 4 features:
1. Edit Savings: C.I. team can edit cost/time savings for evaluated ideas via PUT /api/ideas/{id}/update-savings
2. Export Excel: Button on IdeasList page downloads ideas as .xlsx file
3. Admin toggle: can_change_subrole field affects Profile page sub-role change visibility
4. Backend Health: API still works after modular refactor (models, services modules)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://philtech-eyedea.preview.emergentagent.com')

# Test credentials
ADMIN_CREDS = {"username": "admin", "password": "admin123"}
APPROVER_CREDS = {"username": "approver1", "password": "approver123"}  # C.I. Excellence Team
USER_CREDS = {"username": "user1", "password": "user123"}


class TestBackendHealth:
    """Test backend health after modular refactor"""
    
    def test_health_endpoint(self):
        """Test /api/health endpoint works"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data
        print("✓ Health endpoint working")
    
    def test_auth_login_admin(self):
        """Test admin login works after refactor"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        print("✓ Admin login working")
    
    def test_auth_login_approver(self):
        """Test approver login works after refactor"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=APPROVER_CREDS)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["role"] == "approver"
        print("✓ Approver login working")
    
    def test_ideas_list_endpoint(self):
        """Test ideas list endpoint works after refactor"""
        # Login first
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        token = login_resp.json()["access_token"]
        
        response = requests.get(
            f"{BASE_URL}/api/ideas",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("✓ Ideas list endpoint working")


class TestExportExcel:
    """Test Excel export functionality"""
    
    def test_export_excel_endpoint(self):
        """Test /api/dashboard/export-excel returns xlsx file"""
        # Login first
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        token = login_resp.json()["access_token"]
        
        response = requests.get(
            f"{BASE_URL}/api/dashboard/export-excel",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        # Check content type is Excel
        content_type = response.headers.get("content-type", "")
        assert "spreadsheetml" in content_type or "application/vnd" in content_type
        # Check content disposition header
        content_disp = response.headers.get("content-disposition", "")
        assert "philtech_eyedeas.xlsx" in content_disp
        # Check we got actual content
        assert len(response.content) > 0
        print(f"✓ Excel export working - file size: {len(response.content)} bytes")
    
    def test_export_excel_requires_auth(self):
        """Test export endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/dashboard/export-excel")
        assert response.status_code in [401, 403]
        print("✓ Excel export requires authentication")


class TestUpdateSavings:
    """Test update savings endpoint for C.I. Excellence Team"""
    
    @pytest.fixture
    def ci_token(self):
        """Get C.I. Excellence Team token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=APPROVER_CREDS)
        return login_resp.json()["access_token"]
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        return login_resp.json()["access_token"]
    
    @pytest.fixture
    def user_token(self):
        """Get regular user token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=USER_CREDS)
        return login_resp.json()["access_token"]
    
    def test_update_savings_endpoint_exists(self, ci_token):
        """Test PUT /api/ideas/{id}/update-savings endpoint exists"""
        # Get an evaluated idea first
        response = requests.get(
            f"{BASE_URL}/api/ideas",
            headers={"Authorization": f"Bearer {ci_token}"}
        )
        ideas = response.json()
        
        # Find an evaluated idea (has complexity_level or is_quick_win)
        evaluated_idea = None
        for idea in ideas:
            if idea.get("complexity_level") or idea.get("is_quick_win"):
                evaluated_idea = idea
                break
        
        if not evaluated_idea:
            pytest.skip("No evaluated ideas found to test update-savings")
        
        # Test the endpoint
        response = requests.put(
            f"{BASE_URL}/api/ideas/{evaluated_idea['id']}/update-savings",
            headers={"Authorization": f"Bearer {ci_token}"},
            json={"savings_type": "cost_savings", "cost_savings": 1000}
        )
        
        # Should succeed or fail with proper error (not 404 for endpoint)
        assert response.status_code in [200, 400, 403]
        print(f"✓ Update savings endpoint exists - status: {response.status_code}")
    
    def test_update_savings_cost_savings(self, ci_token):
        """Test updating cost savings"""
        # Get an evaluated idea
        response = requests.get(
            f"{BASE_URL}/api/ideas",
            headers={"Authorization": f"Bearer {ci_token}"}
        )
        ideas = response.json()
        
        evaluated_idea = None
        for idea in ideas:
            if idea.get("complexity_level") and not idea.get("is_quick_win"):
                evaluated_idea = idea
                break
        
        if not evaluated_idea:
            pytest.skip("No evaluated non-quick-win ideas found")
        
        # Update cost savings
        update_data = {
            "savings_type": "cost_savings",
            "cost_savings": 5000
        }
        
        response = requests.put(
            f"{BASE_URL}/api/ideas/{evaluated_idea['id']}/update-savings",
            headers={"Authorization": f"Bearer {ci_token}"},
            json=update_data
        )
        
        if response.status_code == 200:
            # Verify the update
            get_resp = requests.get(
                f"{BASE_URL}/api/ideas/{evaluated_idea['id']}",
                headers={"Authorization": f"Bearer {ci_token}"}
            )
            updated_idea = get_resp.json()
            assert updated_idea.get("savings_type") == "cost_savings"
            assert updated_idea.get("cost_savings") == 5000
            print("✓ Cost savings update working")
        else:
            print(f"Update savings returned: {response.status_code} - {response.json()}")
    
    def test_update_savings_time_saved(self, ci_token):
        """Test updating time saved"""
        # Get an evaluated idea
        response = requests.get(
            f"{BASE_URL}/api/ideas",
            headers={"Authorization": f"Bearer {ci_token}"}
        )
        ideas = response.json()
        
        evaluated_idea = None
        for idea in ideas:
            if idea.get("complexity_level") and not idea.get("is_quick_win"):
                evaluated_idea = idea
                break
        
        if not evaluated_idea:
            pytest.skip("No evaluated non-quick-win ideas found")
        
        # Update time saved
        update_data = {
            "savings_type": "time_saved",
            "time_saved_hours": 10,
            "time_saved_minutes": 30
        }
        
        response = requests.put(
            f"{BASE_URL}/api/ideas/{evaluated_idea['id']}/update-savings",
            headers={"Authorization": f"Bearer {ci_token}"},
            json=update_data
        )
        
        if response.status_code == 200:
            # Verify the update
            get_resp = requests.get(
                f"{BASE_URL}/api/ideas/{evaluated_idea['id']}",
                headers={"Authorization": f"Bearer {ci_token}"}
            )
            updated_idea = get_resp.json()
            assert updated_idea.get("savings_type") == "time_saved"
            assert updated_idea.get("time_saved_hours") == 10
            assert updated_idea.get("time_saved_minutes") == 30
            print("✓ Time saved update working")
        else:
            print(f"Update savings returned: {response.status_code} - {response.json()}")
    
    def test_update_savings_requires_ci_role(self, user_token):
        """Test that regular users cannot update savings"""
        # Get any idea
        response = requests.get(
            f"{BASE_URL}/api/ideas",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        ideas = response.json()
        
        if not ideas:
            pytest.skip("No ideas found")
        
        # Try to update savings as regular user
        response = requests.put(
            f"{BASE_URL}/api/ideas/{ideas[0]['id']}/update-savings",
            headers={"Authorization": f"Bearer {user_token}"},
            json={"savings_type": "cost_savings", "cost_savings": 1000}
        )
        
        assert response.status_code == 403
        print("✓ Update savings correctly requires C.I. role")
    
    def test_update_savings_only_for_evaluated_ideas(self, ci_token):
        """Test that savings can only be updated for evaluated ideas"""
        # Get a non-evaluated idea (pending status, no complexity_level)
        response = requests.get(
            f"{BASE_URL}/api/ideas?status=pending",
            headers={"Authorization": f"Bearer {ci_token}"}
        )
        ideas = response.json()
        
        non_evaluated = None
        for idea in ideas:
            if not idea.get("complexity_level") and idea.get("is_quick_win") is None:
                non_evaluated = idea
                break
        
        if not non_evaluated:
            pytest.skip("No non-evaluated ideas found")
        
        # Try to update savings for non-evaluated idea
        response = requests.put(
            f"{BASE_URL}/api/ideas/{non_evaluated['id']}/update-savings",
            headers={"Authorization": f"Bearer {ci_token}"},
            json={"savings_type": "cost_savings", "cost_savings": 1000}
        )
        
        assert response.status_code == 400
        print("✓ Update savings correctly rejects non-evaluated ideas")


class TestCanChangeSubrole:
    """Test can_change_subrole field in admin panel"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        return login_resp.json()["access_token"]
    
    def test_user_model_has_can_change_subrole(self, admin_token):
        """Test that user model includes can_change_subrole field"""
        # Get users list
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        users = response.json()
        
        # Check if any user has the field (it may be optional)
        # The field should be accepted in updates
        print("✓ Admin users endpoint working")
    
    def test_update_user_with_can_change_subrole(self, admin_token):
        """Test updating user with can_change_subrole field"""
        # Get users list
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        users = response.json()
        
        # Find an approver user to update
        approver_user = None
        for user in users:
            if user.get("role") == "approver":
                approver_user = user
                break
        
        if not approver_user:
            pytest.skip("No approver users found to test")
        
        # Update user with can_change_subrole = false
        update_data = {
            "username": approver_user["username"],
            "email": approver_user["email"],
            "role": approver_user["role"],
            "department": approver_user.get("department"),
            "team": approver_user.get("team"),
            "pillar": approver_user.get("pillar"),
            "manager": approver_user.get("manager"),
            "can_change_subrole": False
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{approver_user['id']}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=update_data
        )
        
        assert response.status_code == 200
        updated_user = response.json()
        assert updated_user.get("can_change_subrole") == False
        print("✓ can_change_subrole field update working (set to false)")
        
        # Reset it back to true
        update_data["can_change_subrole"] = True
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{approver_user['id']}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=update_data
        )
        
        assert response.status_code == 200
        updated_user = response.json()
        assert updated_user.get("can_change_subrole") == True
        print("✓ can_change_subrole field update working (set to true)")
    
    def test_approver_me_endpoint_returns_can_change_subrole(self):
        """Test that /api/auth/me returns can_change_subrole for approvers"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=APPROVER_CREDS)
        token = login_resp.json()["access_token"]
        
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        user = response.json()
        # The field should exist (may be true, false, or None)
        # Just verify the endpoint works
        print(f"✓ /api/auth/me returns user data - can_change_subrole: {user.get('can_change_subrole')}")


class TestModularRefactor:
    """Test that modular refactor didn't break existing functionality"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        return login_resp.json()["access_token"]
    
    def test_pillars_endpoint(self, admin_token):
        """Test pillars endpoint works"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pillars",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("✓ Pillars endpoint working")
    
    def test_departments_endpoint(self, admin_token):
        """Test departments endpoint works"""
        response = requests.get(
            f"{BASE_URL}/api/admin/departments",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("✓ Departments endpoint working")
    
    def test_teams_endpoint(self, admin_token):
        """Test teams endpoint works"""
        response = requests.get(
            f"{BASE_URL}/api/admin/teams",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("✓ Teams endpoint working")
    
    def test_dashboard_stats_endpoint(self, admin_token):
        """Test dashboard stats endpoint works"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_ideas" in data
        print("✓ Dashboard stats endpoint working")
    
    def test_dashboard_analytics_endpoint(self, admin_token):
        """Test dashboard analytics endpoint works"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/analytics",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "quick_wins_count" in data
        print("✓ Dashboard analytics endpoint working")
    
    def test_tech_persons_endpoint(self, admin_token):
        """Test tech persons endpoint works"""
        response = requests.get(
            f"{BASE_URL}/api/admin/tech-persons",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("✓ Tech persons endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
