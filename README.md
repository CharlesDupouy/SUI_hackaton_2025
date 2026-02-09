# Love Lock App 💕🔒

A beautiful blockchain-based love lock application built on the Sui network. Create, send, and manage love locks that can be permanently locked on a digital bridge when accepted by the recipient.

## 🚀 How to Launch the App

### Prerequisites
- Node.js >= 18.12.0
- pnpm >= 8.0.0
- A Sui wallet (Sui Wallet, Suiet, etc.)

### Installation & Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd template
   pnpm install
   ```

2. **Configure network constants:**
   - Update the package IDs and bridge IDs in `app/constants.ts`
   - Set the correct network configuration in `app/networkConfig.ts`

3. **Start the development server:**
   ```bash
   pnpm dev
   ```

4. **Open your browser:**
   - Navigate to `http://localhost:3000`
   - Connect your Sui wallet
   - Start creating love locks!

### Production Build
```bash
pnpm build
pnpm start
```

## ✨ Features

### 🔐 Core Functionality

#### 1. **Create Love Locks**
- Create personalized love locks with custom messages
- Set creation dates for special occasions
- Send locks to any Sui address
- Pay 0.39 SUI (390 000 MIST) to create a lock
- Payment is not refunded if recipient declines

#### 2. **Accept/Decline Locks**
- Recipients receive love locks in their wallet
- View lock details including creator, message, and date
- Accept to permanently lock on the bridge (payment goes to bridge master)
- Decline to destroy the lock

#### 3. **Search & Discovery**
- Search for existing love locks by Object ID
- View all locks that have been permanently locked on the bridge
- Browse pending locks waiting for your response
- Access lock details and status information

#### 4. **Bridge Visualization**
- Visual representation of the digital bridge
- Heart-shaped locks displayed on bridge imagery
- Dynamic bridge height based on number of accepted locks
- Interactive lock viewing with creation dates

### 🎨 User Interface Features

- **Modern Design**: Pink-themed UI with love lock aesthetics
- **Responsive Layout**: Works on desktop and mobile devices
- **Real-time Updates**: Live transaction status and loading indicators
- **Wallet Integration**: Seamless Sui wallet connection
- **Navigation**: Easy switching between different app sections

### 🔧 Technical Features

- **Blockchain Integration**: Built on Sui network using Move smart contracts
- **Type Safety**: Full TypeScript implementation
- **State Management**: React hooks for efficient state handling
- **Error Handling**: Comprehensive error messages and user feedback
- **Transaction Management**: Automatic transaction waiting and confirmation

## 💰 Business Model

### Payment System
- **Lock Creation Cost**: 0.39 SUI (390 000 MIST) per love lock
- **Payment Flow**:
  1. Creator pays the lock price when creating a lock
  2. Payment is held in escrow within the lock object
  3. If recipient **accepts**: Payment goes to the bridge master (revenue)
  4. If recipient **declines**: Payment is not returned to the creator

### Revenue Model
- **Bridge Master**: Receives all payments from accepted love locks
- **No Fees**: No additional platform fees - only the lock creation cost
- **Permanent Storage**: Accepted locks are permanently stored on the blockchain
- **Decentralized**: No central authority controls the bridge or payments

### Economic Incentives
- **Creators**: Pay upfront
- **Recipients**: Can accept (locking forever) or decline 
- **Bridge Master**: Earns from all accepted locks
- **Network**: Benefits from transaction fees and storage

## 🔗 Network Configuration

### Usefuls IDs (TESTNET)

// Test Network  
LOVELOCK_PACKAGE_ID = "0x73107b51f0a2c9b4c2e32739aabd845d744a378feb288ceabdceec4270ec618e";

BRIDGE_OBJECT_ID = "0x418c940e3be13371c8d64e64e205989fe61f0ad0ccbbbd862a677210835a92a1";

EXAMPLE_LOCK_IDS = [
  "0x0x4caf6aac0dcf2ad95328f10598aa2b5db7ae3c65df5e5deaebbe4b52b311e26f", // An example lock
  "CiMK8Zt8M271KDnrDACmAkTnnVP7UkcNzokYZqiQMAhP", // example digest for a declined lock (it was deleted)
];
```

## 🏗️ Architecture

### Frontend (Next.js)
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with custom love lock theme
- **UI Components**: Radix UI components with custom styling
- **State Management**: React hooks and context
- **Wallet Integration**: Sui dApp Kit

### Backend (Sui Move)
- **Smart Contract**: Move language on Sui network
- **Lock Management**: Immutable lock objects with metadata
- **Bridge System**: Shared object for permanent lock storage
- **Payment Handling**: SUI coin escrow and distribution

### Key Components
- `CreateLock.tsx`: Lock creation interface
- `Lock.tsx`: Individual lock viewing and interaction
- `LockList.tsx`: Search functionality for existing locks
- `BridgeLocks.tsx`: Visual bridge with all accepted locks
- `PendingLocks.tsx`: Manage locks waiting for response

## 🔒 Security Features

- **Immutable Locks**: Once accepted, locks cannot be modified
- **Address Validation**: Proper Sui address format checking
- **Transaction Verification**: Blockchain confirmation for all operations
- **No Central Control**: Fully decentralized operation

## 📱 Usage Guide

1. **Connect Wallet**: Use any Sui-compatible wallet
2. **Create Lock**: Fill in recipient address, message, and date
3. **Send Lock**: Pay the creation fee and send to recipient
4. **Recipient Response**: Recipient can accept (permanent) or decline
5. **View Results**: Search for locks or view the bridge visualization

## 🛠️ Development

### Tech Stack
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Blockchain**: Sui, Move smart contracts
- **Wallet**: Sui dApp Kit
- **Package Manager**: pnpm

### Key Dependencies
- `@mysten/dapp-kit`: Sui wallet integration
- `@mysten/sui`: Sui blockchain interaction
- `next`: React framework
- `tailwindcss`: Styling
- `lucide-react`: Icons

## 📄 License

This project is part of the Sui blockchain ecosystem and follows open-source principles.

---

**Love Lock App** - Where digital love meets blockchain permanence 💕🔒
