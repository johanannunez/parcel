# Parcel Quick-Add: Apple Shortcut Setup

Add tasks to Parcel from anywhere on iPhone, iPad, or Mac. Works with Siri, the lock screen, the share sheet, and the menu bar.

## Step 1: Generate an API Token

1. Sign in to Parcel admin at https://www.theparcelco.com/admin
2. Go to Settings and find the API Tokens section
3. Click Generate Token and name it "Apple Shortcut"
4. Copy the token. It is shown only once.

## Step 2: Build the Shortcut

Open the Shortcuts app on your iPhone or Mac. Create a new shortcut and name it exactly **Add to Parcel**.

Add these actions in order:

**Action 1: Ask for Input**
- Prompt: `What's the task?`
- Input Type: Text
- Variable name: `TaskTitle`

**Action 2: Ask for Input**
- Prompt: `Due date? (e.g. "tomorrow", "next Friday", or leave blank to skip)`
- Input Type: Text
- Allow empty responses: Yes
- Variable name: `DueDate`

**Action 3: Get Contents of URL**
- URL: `https://www.theparcelco.com/api/tasks/quick-add`
- Method: POST
- Headers:
  - `Authorization`: `Bearer YOUR_TOKEN_HERE` (replace with your token from Step 1)
  - `Content-Type`: `application/json`
- Request Body: JSON
  - Key `title`, Value: variable `TaskTitle`
  - Key `dueDate`, Value: variable `DueDate`

**Action 4: Show Notification**
- Title: `Parcel`
- Body: `Task added`

## Step 3: Add to Your Devices

| Surface | How to add |
|---------|-----------|
| iPhone home screen | Long-press the shortcut in Shortcuts app, tap Add to Home Screen |
| iPhone lock screen | Settings > Lock Screen > Customize > Widgets > Shortcuts |
| Mac menu bar | Right-click the shortcut in Shortcuts app > Add to Menu Bar |
| Siri | Say "Add to Parcel" (shortcut must be named exactly "Add to Parcel") |
| Share sheet | Open shortcut settings > toggle Show in Share Sheet |

## Step 4: Test

1. Run the shortcut
2. Type a task title: "Review lease renewal"
3. Type a due date: "next friday"
4. The task should appear in Parcel admin under Tasks > Today or Upcoming within 2 seconds
5. If a due date was provided, it also appears in Fantastical on that date

## Troubleshooting

**"Invalid token" error**: The API token is wrong or expired. Generate a new one in Parcel Settings.

**"Unauthorized" error**: Make sure the Authorization header is `Bearer ` followed immediately by your token with no extra spaces.

**Task appears but has no due date**: The date format was not recognized. Use phrases like "tomorrow", "next Monday", "April 30", or ISO format "2026-04-30".

**Siri does not respond**: The shortcut must be named exactly "Add to Parcel" with that capitalization.
