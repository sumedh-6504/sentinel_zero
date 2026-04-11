import dotenv from 'dotenv';
dotenv.config();

const testFix = async () => {
    // Note: We are using port 3001 as configured in previous step
    const PORT = process.env.PORT || 3001;
    const API_URL = `http://localhost:${PORT}/api/v1/scans/review`;
    
    const vulnId = process.argv[2];

    if (!vulnId) {
        console.error("❌ Please provide a Vulnerability ID from Supabase!");
        console.log("Usage: npx ts-node src/modules/scripts/test-fix.ts <vuln-id>");
        process.exit(1);
    }

    const payload = {
        vulnerability_id: vulnId,
        decision: "approved_real_bug",
        feedback: "Please fix this using a parameterized query and ensure strict type checking."
    };

    console.log(`🚀 Sending approval for vulnerability: ${vulnId}...`);

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
            console.log("✅ Success! Human review submitted. Fixer Agent should be running now.");
            console.table(data);
        } else {
            console.error("❌ API Error:", data);
        }
    } catch (error) {
        console.error("🔥 Connection Failed. Is your server running on port 3001?", error);
    }
};

testFix();
