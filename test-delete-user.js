// Test script to verify DELETE /users works with access_token fix
// Run with: node test-delete-user.js

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

async function testLogin() {
    console.log('1. Testing login with admin/admin!...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: 'admin',
            password: 'admin!',
        }),
    });

    if (!loginResponse.ok) {
        console.error('❌ Login failed:', loginResponse.status, await loginResponse.text());
        return null;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    console.log('Token:', loginData.access_token);
    return loginData.access_token;
}

async function testCreateUser(token) {
    console.log('\n2. Creating a test user to delete...');
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            barcode: '9999999999999',
            nome: 'TestDelete',
            cognome: 'User',
        }),
    });

    if (!response.ok) {
        console.error('❌ POST /users failed:', response.status, await response.text());
        return null;
    }

    console.log('✅ User created successfully');
    return '9999999999999';
}

async function testDeleteUser(token, barcode) {
    console.log(`\n3. Testing DELETE /users/${barcode} with token...`);
    console.log('Authorization header:', `Bearer ${token}`);

    const response = await fetch(`${API_BASE_URL}/users/${barcode}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    console.log('Response status:', response.status);

    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (!response.ok) {
        console.error('❌ DELETE /users failed with status:', response.status);
        return false;
    }

    console.log('✅ DELETE /users successful!');
    return true;
}

async function main() {
    try {
        const token = await testLogin();
        if (!token) {
            console.error('Cannot proceed without token');
            process.exit(1);
        }

        const barcode = await testCreateUser(token);
        if (!barcode) {
            console.error('Cannot test delete without creating a user first');
            process.exit(1);
        }

        const success = await testDeleteUser(token, barcode);
        if (!success) {
            process.exit(1);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
