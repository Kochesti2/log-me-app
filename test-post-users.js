// Test script to debug POST /users unauthorized error
// Run with: node test-post-users.js

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
    console.log('Full response:', JSON.stringify(loginData, null, 2));
    console.log('Token:', loginData.access_token);
    return loginData.access_token;
}

async function testPostUsers(token) {
    console.log('\n2. Testing POST /users with token...');
    console.log('Authorization header:', `Bearer ${token}`);

    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            barcode: '1234567890123',
            nome: 'Test',
            cognome: 'User',
        }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (!response.ok) {
        console.error('❌ POST /users failed with status:', response.status);
        return false;
    }

    console.log('✅ POST /users successful!');
    return true;
}

async function main() {
    try {
        const token = await testLogin();
        if (!token) {
            console.error('Cannot proceed without token');
            process.exit(1);
        }

        await testPostUsers(token);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
