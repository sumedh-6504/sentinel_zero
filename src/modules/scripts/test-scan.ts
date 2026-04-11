import dotenv from 'dotenv';
dotenv.config();

const testScan = async () => {
    const API_URL = "http://localhost:3000/api/v1/scans/scan";
    
    const payload = {
        github_url: "https://github.com/pallets/flask",
        full_name: "pallets/flask"
    };

    console.log("🚀 Sending request to Sentinel-Zero API...");

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ Success! Job Created:");
            console.table(data);
        } else {
            console.error("❌ API Error:", data);
        }
    } catch (error) {
        console.error("🔥 Connection Failed. Is your server running?", error);
    }
};

testScan();