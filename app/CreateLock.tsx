import { Transaction } from "@mysten/sui/transactions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useNetworkVariable } from "./networkConfig";
import { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";

export function CreateLock({
  onCreated,
}: {
  onCreated: (id: string) => void;
}) {
  const lovelockPackageId = useNetworkVariable("lovelockPackageId");
  const bridgeObjectId = useNetworkVariable("bridgeObjectId");
  const suiClient = useSuiClient();
  const {
    mutate: signAndExecute,
    isSuccess,
    isPending,
  } = useSignAndExecuteTransaction();

  const [recipientAddress, setRecipientAddress] = useState("");
  const [message, setMessage] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  function create() {
    if (!recipientAddress || !message || !day || !month || !year) {
      alert("Please fill in all fields");
      return;
    }

    console.log('creating lock transaction');
    const tx = new Transaction();

    tx.moveCall({
      arguments: [
        tx.object(bridgeObjectId),
        tx.pure.address(recipientAddress),
        tx.pure.string(message),
        tx.pure.u8(parseInt(day)),
        tx.pure.u8(parseInt(month)),
        tx.pure.u16(parseInt(year)),
        tx.splitCoins(tx.gas, [390]), // LOCK_PRICE amount
      ],
      target: `${lovelockPackageId}::lovelock::create_lock`,
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async ({ digest }) => {
          const { effects } = await suiClient.waitForTransaction({
            digest: digest,
            options: {
              showEffects: true,
            },
          });

          // The created lock object ID will be in the effects
          onCreated(effects?.created?.[0]?.reference?.objectId!);
        },
      },
    );
  }

  const isFormValid = recipientAddress && message && day && month && year;

  return (
    <Card className="max-w-md mx-auto love-lock-card">
      <CardHeader>
        <CardTitle className="love-lock-text">Create New Love Lock</CardTitle>
        <CardDescription className="love-lock-text-muted">
          Create a love lock that will be sent to someone special. They can choose to accept it (locking it forever) or decline it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium love-lock-text">Recipient Address</label>
          <input
            type="text"
            placeholder="Enter recipient's Sui address"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 love-lock-text"
            style={{ backgroundColor: 'white' }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium love-lock-text">Message</label>
          <input
            type="text"
            placeholder="Your love message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 love-lock-text"
            style={{ backgroundColor: 'white' }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium love-lock-text">Creation Date</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Day"
              min="1"
              max="31"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="flex-1 px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 love-lock-text"
              style={{ backgroundColor: 'white' }}
            />
            <input
              type="number"
              placeholder="Month"
              min="1"
              max="12"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="flex-1 px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 love-lock-text"
              style={{ backgroundColor: 'white' }}
            />
            <input
              type="number"
              placeholder="Year"
              min="2024"
              max="2100"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="flex-1 px-3 py-2 border border-pink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 love-lock-text"
              style={{ backgroundColor: 'white' }}
            />
          </div>
        </div>

        <div className="love-lock-accent p-3 rounded-md">
          <p className="text-sm love-lock-text">
            <strong>Cost:</strong> 0.00039 SUI (390 MIST)
            <br />
            <strong>Note:</strong> This amount will be returned if the recipient declines the lock.
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => {
            create();
          }}
          disabled={isSuccess || isPending || !isFormValid}
          className="w-full love-lock-button text-white disabled:bg-pink-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
        >
          {isSuccess || isPending ? <ClipLoader size={20} color="white" /> : "Create Love Lock"}
        </Button>
      </CardContent>
    </Card>
  );
}
