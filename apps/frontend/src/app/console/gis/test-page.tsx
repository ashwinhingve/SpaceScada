'use client';

export default function TestPage() {
    console.log('🧪 TEST PAGE LOADED - If you see this, the build is working!');

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    return (
        <div className="p-8 bg-gray-900 text-white">
            <h1 className="text-2xl font-bold mb-4">GIS Debug Test Page</h1>
            <div className="space-y-2">
                <p>✅ This page loaded successfully</p>
                <p>API Key: {apiKey ? `${apiKey.substring(0, 20)}... (${apiKey.length} chars)` : '❌ MISSING'}</p>
                <p>Check console for test message</p>
            </div>
        </div>
    );
}
