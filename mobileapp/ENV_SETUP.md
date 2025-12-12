# Environment Variables Setup

## Creating .env File

Create a `.env` file in the `mobileapp` directory with the following content:

```env
# Socket.IO Server URL Configuration
# For simulator/emulator: http://localhost:3000
# For physical devices: http://YOUR_COMPUTER_IP:3000
# Example: http://192.168.1.100:3000
# 
# To find your computer's IP address:
# - Mac/Linux: Run `ifconfig` or `ip addr` in terminal
# - Windows: Run `ipconfig` in command prompt
# - Look for your local network IP (usually starts with 192.168.x.x or 10.0.x.x)
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000
```

## Quick Setup

1. **For Simulator/Emulator:**
   ```env
   EXPO_PUBLIC_SOCKET_URL=http://localhost:3000
   ```

2. **For Physical Devices:**
   - Find your computer's IP address:
     - Mac/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
     - Windows: `ipconfig` (look for IPv4 Address)
   - Update `.env` file:
     ```env
     EXPO_PUBLIC_SOCKET_URL=http://192.168.1.100:3000
     ```
     (Replace `192.168.1.100` with your actual IP)

## Important Notes

- The `.env` file is already in `.gitignore` and won't be committed to git
- After creating/updating `.env`, restart your Expo development server
- Make sure your backend server is running on the specified URL
- For physical devices, ensure your phone and computer are on the same network

