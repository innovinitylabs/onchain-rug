// Debug the base64 issue
const tokenURI = "data:application/json;base64,eyJuYW1lIjoiT25jaGFpbiBSdWcgIzEiLCJkZXNjcmlwdGlvbiI6IkEgZnVsbHkgb24tY2hhaW4gZ2VuZXJhdGVkIHJ1ZyB3aXRoIGN1c3RvbSB0ZXh0LiBUaGlzIHJ1ZyBhZ2VzIG92ZXIgdGltZSBhbmQgY2FuIGJlIGNsZWFuZWQuIiwiaW1hZ2UiOiJkYXRhOnRleHQvaHRtbDtiYXNlNjQsUENGRVQwTlVXVkJGSUdoMGJXdytQR2gwYld3K1BHaGxZV1ErUEcxbGRHRWdZMmhoY25ObGREMGlWVlJHTFRnaVBqeDBhWFJzWlQ1U2RXYzhMM1JwZEd4bFBqeHpkSGxzWlQ1aWIyUjVlMjFoY21kcGJqb3dPM0JoWkdScGJtYzZNRHRpWVdOclozSnZkVzVrT2lNd01EQTdmV05oYm5aaGMzdGthWE53YkdGNU9tSnNiMk5yTzIxaGNtZHBianBoZFhSdk8zMDhMM04wZVd4bFBqd3ZhR1ZoWkQ0OFltOWtlVDQ4WkdsMklHbGtQU0pqWVc1MllYTXRZMjl1ZEdGcGJtVnlJajQ4TDJScGRqNDhjMk55YVhCMElITnlZejBpYUhSMGNITTZMeTlqWkc1cWN5NWpiRzkxWkdac1lYSmxMbU52YlM5aGFtRjRMMnhwWW5NdmNEVXVhbk12TVM0M0xqQXZjRFV1YldsdUxtcHpJajQ4TDNOamNtbHdkRDQ4YzJOeWFYQjBQbXhsZENCelpXVmtQVEV5TXpRMU8yeGxkQ0IwWlhoMFVtOTNjejFiSWtoRlRFeFBJaXdpVjA5U1RFUWlYVHRzWlhRZ2QyRnljRlJvYVdOcmJtVnpjejB4TzJ4bGRDQndZV3hsZEhSbFBYc2lZMjlzYjNKeklqcGJJaU00UWpRMU1UTWlMQ0lqUkRJMk9URkZJaXdpSTBORU9EVXpSaUlzSWlOR05FRTBOakFpTENJalJFVkNPRGczSWwxOU8yeGxkQ0J6ZEhKcGNHVkVZWFJoUFZ0N0lua2lPakFzSW1obGFXZG9kQ0k2TkRBd0xDSndjbWx0WVhKNVEyOXNiM0lpT2lJak9FSTBOVEV6SWl3aWQyVmhkbVZVZVhCbElqb2ljMjlzYVdRaWZTeDdJbmtpT2pRd01Dd2lhR1ZwWjJoMElqbzBNREFzSW5CeWFXMWhjbmxEYjJ4dmNpSTZJaU5FTWpZNU1VVWlMQ0ozWldGMlpWUjVjR1VpT2lKemIyeHBaQ0o5WFR0c1pYUWdjMmh2ZDBScGNuUTlabUZzYzJVN2JHVjBJR1JwY25STVpYWmxiRDB3TzJ4bGRDQnphRzkzVkdWNGRIVnlaVDFtWVd4elpUdHNaWFFnZEdWNGRIVnlaVXhsZG1Wc1BUQTdablZ1WTNScGIyNGdjMlYwZFhBb0tYdGpjbVZoZEdWRFlXNTJZWE1vT0RBd0xEWXdNQ2s3WW1GamEyZHliM1Z1WkNneU5UVXNNQ3d3S1R0MFpYaDBRV3hwWjI0b1EwVk9WRVZTS1R0MFpYaDBVMmw2WlNnek1pazdabWxzYkNnd0tUdDBaWGgwS0NKSVJVeE1UeUJYVDFKTVJDSXNkMmxrZEdndk1peG9aV2xuYUhRdk1pazdibTlNYjI5d0tDazdmVHd2YzJOeWFYQjBQand2WW05a2VUNDhMMmgwYld3KyIsImFuaW1hdGlvbl91cmwiOiJkYXRhOnRleHQvaHRtbDtiYXNlNjQsUENGRVQwTlVXVkJGSUdoMGJXdytQR2gwYld3K1BHaGxZV1ErUEcxbGRHRWdZMmhoY25ObGREMGlWVlJHTFRnaVBqeDBhWFJzWlQ1U2RXYzhMM1JwZEd4bFBqeHpkSGxzWlQ1aWIyUjVlMjFoY21kcGJqb3dPM0JoWkdScGJtYzZNRHRpWVdOclozSnZkVzVrT2lNd01EQTdmV05oYm5aaGMzdGthWE53YkdGNU9tSnNiMk5yTzIxaGNtZHBianBoZFhSdk8zMDhMM04wZVd4bFBqd3ZhR1ZoWkQ0OFltOWtlVDQ4WkdsMklHbGtQU0pqWVc1MllYTXRZMjl1ZEdGcGJtVnlJajQ4TDJScGRqNDhjMk55YVhCMElITnlZejBpYUhSMGNITTZMeTlqWkc1cWN5NWpiRzkxWkdac1lYSmxMbU52YlM5aGFtRjRMMnhwWW5NdmNEVXVhbk12TVM0M0xqQXZjRFV1YldsdUxtcHpJajQ4TDNOamNtbHdkRDQ4YzJOeWFYQjBQbXhsZENCelpXVmtQVEV5TXpRMU8yeGxkQ0IwWlhoMFVtOTNjejFiSWtoRlRFeFBJaXdpVjA5U1RFUWlYVHRzWlhRZ2QyRnljRlJvYVdOcmJtVnpjejB4TzJ4bGRDQndZV3hsZEhSbFBYc2lZMjlzYjNKeklqcGJJaU00UWpRMU1UTWlMQ0lqUkRJMk9URkZJaXdpSTBORU9EVXpSaUlzSWlOR05FRTBOakFpTENJalJFVkNPRGczSWwxOU8yeGxkQ0J6ZEhKcGNHVkVZWFJoUFZ0N0lua2lPakFzSW1obGFXZG9kQ0k2TkRBd0xDSndjbWx0WVhKNVEyOXNiM0lpT2lJak9FSTBOVEV6SWl3aWQyVmhkbVZVZVhCbElqb2ljMjlzYVdRaWZTeDdJbmtpT2pRd01Dd2lhR1ZwWjJoMElqbzBNREFzSW5CeWFXMWhjbmxEYjJ4dmNpSTZJaU5FTWpZNU1VVWlMQ0ozWldGMlpWUjVjR1VpT2lKemIyeHBaQ0o5WFR0c1pYUWdjMmh2ZDBScGNuUTlabUZzYzJVN2JHVjBJR1JwY25STVpYWmxiRDB3TzJ4bGRDQnphRzkzVkdWNGRIVnlaVDFtWVd4elpUdHNaWFFnZEdWNGRIVnlaVXhsZG1Wc1BUQTdablZ1WTNScGIyNGdjMlYwZFhBb0tYdGpjbVZoZEdWRFlXNTJZWE1vT0RBd0xEWXdNQ2s3WW1GamEyZHliM1Z1WkNneU5UVXNNQ3d3S1R0MFpYaDBRV3hwWjI0b1EwVk9WRVZTS1R0MFpYaDBVMmw2WlNnek1pazdabWxzYkNnd0tUdDBaWGgwS0NKSVJVeE1UeUJYVDFKTVJDSXNkMmxrZEdndk1peG9aV2xuYUhRdk1pazdibTlNYjI5d0tDazdmVHd2YzJOeWFYQjBQand2WW05a2VUNDhMMmgwYld3KyIsImF0dHJpYnV0ZXMiOlt7InRyYWl0X3R5cGUiOiJUZXh0IExpbmVzIiwidmFsdWUiOjJ9LHsidHJhaXRfdHlwZSI6IldhcnAgVGhpY2tuZXNzIiwidmFsdWUiOjF9LHsidHJhaXRfdHlwZSI6IlNlZWQiLCJ2YWx1ZSI6MTIzNDV9LHsidHJhaXRfdHlwZSI6IkRpcnQgTGV2ZWwiLCJ2YWx1ZSI6MH0seyJ0cmFpdF90eXBlIjoiVGV4dHVyZSBMZXZlbCIsInZhbHVlIjowfV19";

console.log("TokenURI:", tokenURI);

// Extract base64 part
const base64Part = tokenURI.split('data:application/json;base64,')[1];
console.log("\nBase64 part length:", base64Part.length);

// Decode JSON
const jsonStr = Buffer.from(base64Part, 'base64').toString('utf8');
console.log("\nDecoded JSON:");
console.log(jsonStr);

const metadata = JSON.parse(jsonStr);
console.log("\nParsed metadata:");
console.log("Name:", metadata.name);
console.log("Description:", metadata.description);

// Extract HTML from image field
if (metadata.image && metadata.image.includes('data:text/html;base64,')) {
    const htmlBase64 = metadata.image.split('data:text/html;base64,')[1];
    console.log("\nHTML Base64 length:", htmlBase64.length);

    // Try to decode HTML
    try {
        const htmlContent = Buffer.from(htmlBase64, 'base64').toString('utf8');
        console.log("\nDecoded HTML:");
        console.log(htmlContent);

        // Check if HTML is valid
        if (htmlContent.includes('<!DOCTYPE html>') && htmlContent.includes('<html>')) {
            console.log("\n✅ HTML structure is valid!");
        } else {
            console.log("\n❌ HTML structure is invalid!");
        }
    } catch (e) {
        console.log("\n❌ Error decoding HTML:", e.message);

        // Let's check the base64 string
        console.log("\nHTML Base64 string:", htmlBase64);
        console.log("Last 10 characters:", htmlBase64.slice(-10));
        console.log("Ends with +:", htmlBase64.endsWith('+'));
    }
} else {
    console.log("No HTML found in metadata");
}
