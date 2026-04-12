import dotenv from 'dotenv';
dotenv.config();

const testDeployPR = async () => {
    // REPLACE THIS with a real vulnerability ID from your database!
    const VULN_ID = "77679f5d-23ce-4102-bce4-a90d94d98caa"; 
    const API_URL = `http://localhost:3001/api/v1/scans/deploy-pr/${VULN_ID}`;
    
    console.log(`🚀 Triggering Autonomous PR for Vulnerability: ${VULN_ID}...`);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ Success! Pull Request Created!");
            console.log("🔗 PR Link:", data.pr_url);
        } else {
            console.error("❌ API Error:", data);
        }
    } catch (error) {
        console.error("🔥 Connection Failed. Is your server running?", error);
    }
};

testDeployPR();