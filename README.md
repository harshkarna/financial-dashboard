# Net Worth Tracker

A modern web application to track your personal net worth by connecting to Google Sheets data.

## Features

- 🔐 **Google Authentication** - Secure sign-in with Google
- 📊 **Real-time Data** - Direct integration with Google Sheets
- 📈 **Interactive Charts** - Visual representation of net worth trends
- 📱 **Responsive Design** - Works on desktop and mobile
- 🚀 **Fast Performance** - Built with Next.js for optimal speed
- 💰 **Zero Cost Hosting** - Deployed on Vercel's free tier

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with Google Provider
- **Charts**: Recharts
- **Data Source**: Google Sheets API v4
- **Hosting**: Vercel (free tier)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd net-worth-tracker
npm install
```

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API and Google Drive API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-domain.vercel.app/api/auth/callback/google`

### 3. Google Sheets Setup

1. Create or use your existing Google Sheet with monthly 

2. Make sure each tab follows the structure shown in your screenshot
3. Share the sheet with the Google account you'll use to sign in
4. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

### 4. Environment Variables

Create `.env.local` file:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-secret-string
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_SHEET_ID=your-google-sheet-id
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Deployment to Vercel

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Deploy

```bash
vercel --prod
```

### 3. Set Environment Variables

In Vercel dashboard, add all environment variables from `.env.local`

### 4. Update Google OAuth

Add your Vercel domain to Google OAuth redirect URIs:
`https://your-app.vercel.app/api/auth/callback/google`

## Project Structure

```
net-worth-tracker/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth configuration
│   │   └── sheets/        # Google Sheets integration
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Home page
│   └── providers.tsx     # Context providers
├── components/            # React components
│   ├── Dashboard.tsx      # Main dashboard
│   ├── Header.tsx         # Navigation header
│   ├── LoginCard.tsx      # Authentication
│   ├── NetWorthCard.tsx   # Net worth display
│   ├── MonthSelector.tsx  # Month navigation
│   ├── AssetBreakdown.tsx # Asset/liability breakdown
│   └── TrendChart.tsx     # Charts and trends
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vercel.json           # Vercel configuration
```

## Usage

1. **Sign In**: Use your Google account to authenticate
2. **Select Month**: Choose the month you want to view from the dropdown
3. **View Data**: See your net worth, assets, and liabilities
4. **Track Trends**: Monitor your financial progress over time

## Security Notes

- The app only requests read-only access to your Google Sheets
- No financial data is stored on our servers
- All data is fetched directly from your Google Sheets in real-time
- Authentication is handled securely through Google OAuth

## Cost Breakdown

- **Hosting**: Free (Vercel)
- **Database**: Free (Google Sheets)
- **Authentication**: Free (Google OAuth)
- **Total**: ₹0 per month

## Customization

### Adding New Months

Simply create new tabs in your Google Sheet following the same structure. Update the `months` array in `Dashboard.tsx`.

### Modifying Chart Data

Edit the `TrendChart.tsx` component to fetch real data from all months instead of using mock data.

### Styling Changes

Modify `tailwind.config.js` and component styles to match your preferences.

## Troubleshooting

### Common Issues

1. **"Unauthorized" Error**: Check your Google OAuth credentials and redirect URIs
2. **Sheet Not Found**: Verify the Google Sheet ID and sharing permissions
3. **Data Not Loading**: Ensure the sheet structure matches the expected format

### Debug Mode

Enable debug logging by adding to `.env.local`:
```env
NEXTAUTH_DEBUG=true
```

## Contributing

This is a personal project, but feel free to fork and customize for your needs.

## License

MIT License - feel free to use and modify as needed.