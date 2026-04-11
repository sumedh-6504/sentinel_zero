import dotenv from 'dotenv';
dotenv.config();

const testScan = async () => {
    const PORT = process.env.PORT || 3001;
    const API_URL = `http://localhost:${PORT}/api/v1/scans/scan`;
    
    // Grab the 3rd argument from the terminal command
    const inputUrl = process.argv[2];

    if (!inputUrl) {
        console.error("❌ Please provide a GitHub URL!");
        console.log("Usage: npx ts-node src/modules/scripts/test-scan.ts <repo-url>");
        process.exit(1);
    }

    // Automatically extract "username/repo" from "https://github.com/username/repo"
    const cleanedUrl = inputUrl.replace(".git", "").replace(/\/$/, ""); // Clean trailing slashes
    const parts = cleanedUrl.split("/");
    const fullName = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;

    const payload = {
        github_url: cleanedUrl,
        full_name: fullName
    };

    console.log(`🚀 Sending request to API to scan: ${fullName}...`);

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