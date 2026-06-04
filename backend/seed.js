import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from 'dotenv';
dotenv.config();
const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "StudentsPlatform";
const physicalFirstNames = ["Rahul", "Anjali", "Amit", "Priya", "Vikram", "Sneha", 
"Rohan", "Kavya", "Deepak", "Jyothi"];
const classesMap = ["8th Grade", "9th Grade", "10th Grade"];
const timelineMonths = ["January", "February", "March", "April", "May", "June"];
const coreSubjects = ["Telugu", "Hindi", "English", "Social Studies"];
const makeBalancedGrades = () => {
    let scoresNode = {};
    coreSubjects.forEach(subject => {
        scoresNode[subject] = {};
        timelineMonths.forEach(month => {
            scoresNode[subject][month] = Math.floor(Math.random() * 41) + 60; // 60 to 100 range
        });
    });
    return scoresNode;
};
async function seedDatabase() {
    console.log("Connecting to cloud... Launching data injection payload...");
    for (let i = 1; i <= 100; i++) {
        const structuralName = physicalFirstNames[Math.floor(Math.random() * 
physicalFirstNames.length)] + " " + String.fromCharCode(65 + (i % 26)) + " (ID: " + (1000 
+ i) + ")";
        const studentItem = {
            id: `STU_SEED_${1000 + i}`,
            name: structuralName,
             age: Math.floor(Math.random() * 4) + 12, // 12-15
            current_class: classesMap[Math.floor(Math.random() * classesMap.length)],
            marks: makeBalancedGrades()
        };
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: studentItem
        }));
    }
    console.log("Database successfully seeded with 100 detailed records.");
}
seedDatabase().catch(console.error);