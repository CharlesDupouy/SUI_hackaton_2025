'use client'
import { useSuiClient, useSuiClientQuery, useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useNetworkVariable } from "../networkConfig";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";

interface PendingLockData {
  objectId: string;
  p1: string;
  p2: string;
  message: string;
  creation_date: {
    day: number;
    month: number;
    year: number;
  };
  closed: boolean;
}

export function PendingLocks({ onSelectLock }: { onSelectLock: (id: string) => void }) {
  const lovelockPackageId = useNetworkVariable("lovelockPackageId");
  const bridgeObjectId = useNetworkVariable("bridgeObjectId");
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingLocks, setPendingLocks] = useState<PendingLockData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processingLock, setProcessingLock] = useState<string | null>(null);

  const fetchPendingLocks = async () => {
    console.log("🔍 Starting to fetch pending locks...");
    console.log("📍 Current User:", currentAccount?.address);
    console.log("📍 Lovelock Package ID:", lovelockPackageId);

    if (!currentAccount?.address) {
      console.error("❌ No current account");
      setError("Please connect your wallet to view pending locks");
      return;
    }

    if (!lovelockPackageId) {
      console.error("❌ Lovelock package ID not configured");
      setError("Lovelock package ID not configured");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get all objects owned by the current user
      console.log("🔍 Fetching objects owned by current user...");
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        options: {
          showContent: true,
          showType: true,
        },
      });

      console.log("📦 Owned objects response:", ownedObjects);
      console.log("📦 Total owned objects:", ownedObjects.data.length);

      // Log all object types found
      ownedObjects.data.forEach((obj, index) => {
        console.log(`📦 Object ${index + 1}:`, {
          objectId: obj.data?.objectId,
          type: obj.data?.type,
          hasContent: !!obj.data?.content,
          contentType: obj.data?.content?.dataType
        });
      });

      // Filter for Lock objects that are not closed (pending)
      const lockTypeFilter = `${lovelockPackageId}::lovelock::Lock`;
      console.log(`🔍 Filtering for objects containing: "${lockTypeFilter}"`);
      
      const lockObjectsRaw = ownedObjects.data.filter(obj => {
        const isLock = obj.data?.type?.includes(lockTypeFilter);
        console.log(`🔍 Object ${obj.data?.objectId} type "${obj.data?.type}" matches:`, isLock);
        return isLock;
      });

      console.log("🔒 Found lock objects:", lockObjectsRaw.length);

      const allLocks = lockObjectsRaw.map((obj, index) => {
        console.log(`🔒 Processing lock object ${index + 1}:`, obj.data);
        
        if (obj.data?.content?.dataType === "moveObject") {
          const fields = obj.data.content.fields as any;
          console.log(`🔒 Lock ${index + 1} fields:`, fields);
          
          // Parse creation_date properly - it's nested in fields.day/month/year
          let creationDate = fields.creation_date;
          
          // Check if creation_date has a fields property (nested structure)
          if (creationDate && typeof creationDate === 'object' && creationDate.fields) {
            creationDate = {
              day: creationDate.fields.day || 1,
              month: creationDate.fields.month || 1,
              year: creationDate.fields.year || 2024
            };
          } else if (typeof creationDate === 'string') {
            // If it's a string, try to parse it
            try {
              const dateParts = creationDate.split('/');
              if (dateParts.length === 3) {
                creationDate = {
                  day: parseInt(dateParts[0]),
                  month: parseInt(dateParts[1]),
                  year: parseInt(dateParts[2])
                };
              }
            } catch (e) {
              console.warn('Failed to parse date string:', creationDate);
              creationDate = { day: 1, month: 1, year: 2024 }; // fallback
            }
          } else if (!creationDate || typeof creationDate !== 'object') {
            // Fallback if creation_date is missing or not an object
            creationDate = { day: 1, month: 1, year: 2024 };
          }

          const lockData = {
            objectId: obj.data.objectId,
            p1: fields.p1,
            p2: fields.p2,
            message: fields.message,
            creation_date: creationDate,
            closed: fields.closed,
          } as PendingLockData;
          
          console.log(`🔒 Parsed lock ${index + 1}:`, lockData);
          return lockData;
        }
        console.log(`❌ Object ${index + 1} is not a move object`);
        return null;
      }).filter(Boolean) as PendingLockData[];

      // Filter for locks where current user is the recipient (p2) and lock is not closed
      const pendingLocksForUser = allLocks.filter(lock => {
        const isRecipient = lock.p2 === currentAccount.address;
        const isPending = !lock.closed;
        console.log(`🔍 Lock ${lock.objectId}: isRecipient=${isRecipient}, isPending=${isPending}`);
        return isRecipient && isPending;
      });

      console.log("📊 Final results:");
      console.log("📊 All locks found:", allLocks.length);
      console.log("📊 Pending locks for current user:", pendingLocksForUser.length);
      console.log("📊 Pending locks data:", pendingLocksForUser);

      setPendingLocks(pendingLocksForUser);
      
      if (pendingLocksForUser.length === 0) {
        const errorMsg = "No pending love locks found. You don't have any love locks waiting for your response.";
        console.log("ℹ️ Setting info message:", errorMsg);
        setError(errorMsg);
      } else {
        console.log("✅ Successfully found and set pending locks");
      }
      
    } catch (err) {
      console.error("❌ Error fetching pending locks:", err);
      setError("Failed to fetch pending locks. Please try again.");
    } finally {
      console.log("🏁 Finished fetching pending locks");
      setIsLoading(false);
    }
  };

  const handleAcceptDecline = async (lockId: string, accept: boolean) => {
    if (!bridgeObjectId) {
      alert("Bridge object ID not configured");
      return;
    }

    setProcessingLock(lockId);
    console.log(`${accept ? 'Accepting' : 'Declining'} lock:`, lockId);

    try {
      const tx = new Transaction();
      tx.moveCall({
        arguments: [tx.object(lockId), tx.object(bridgeObjectId), tx.pure.bool(accept)],
        target: `${lovelockPackageId}::lovelock::choose_fate_lock`,
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async ({ digest }) => {
            console.log(`✅ Successfully ${accept ? 'accepted' : 'declined'} lock:`, digest);
            // Wait for transaction to be processed
            await suiClient.waitForTransaction({ digest });
            // Refresh the pending locks after processing
            await fetchPendingLocks();
            setProcessingLock(null);
          },
          onError: (error) => {
            console.error(`❌ Error ${accept ? 'accepting' : 'declining'} lock:`, error);
            alert(`Error ${accept ? 'accepting' : 'declining'} lock. Please try again.`);
            setProcessingLock(null);
          },
        }
      );
      
    } catch (err) {
      console.error("Error processing lock:", err);
      alert("Error processing lock. Please try again.");
      setProcessingLock(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold love-lock-text mb-4">My Pending Love Locks</h2>
        <p className="love-lock-text-muted mb-6">
          Love locks that have been sent to you and are waiting for your response
        </p>
      </div>

      {/* Fetch Pending Locks Button */}
      <Card>
        <CardHeader>
          <CardTitle className="love-lock-text">Load My Pending Locks</CardTitle>
          <CardDescription className="love-lock-text-muted">
            Fetch all love locks that have been sent to you and are waiting for your response
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={fetchPendingLocks}
            disabled={isLoading || !currentAccount?.address}
            className="w-full love-lock-button text-white"
          >
            {isLoading ? "Loading..." : "Fetch My Pending Locks"}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant={pendingLocks.length === 0 ? "default" : "destructive"}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pending Locks Display */}
      {pendingLocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="love-lock-text">
              Pending Love Locks ({pendingLocks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingLocks.map((lock) => (
                <div key={lock.objectId} className="flex items-center justify-between p-4 border border-pink-200 rounded-lg love-lock-accent">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold love-lock-text">
                        🔓 Pending Your Response
                      </span>
                      <span className="text-xs love-lock-text-muted">
                        {lock.creation_date?.day && lock.creation_date?.month && lock.creation_date?.year
                          ? `${lock.creation_date.day}/${lock.creation_date.month}/${lock.creation_date.year}`
                          : 'Date not available'}
                      </span>
                    </div>
                    <p className="text-sm love-lock-text mb-1">
                      <strong>From:</strong> {lock.p1.slice(0, 8)}...{lock.p1.slice(-8)}
                    </p>
                    <p className="text-sm love-lock-text mb-1">
                      <strong>To:</strong> {lock.p2.slice(0, 8)}...{lock.p2.slice(-8)} (You)
                    </p>
                    <p className="text-sm love-lock-text-muted italic">
                      "{lock.message.length > 50 ? lock.message.substring(0, 50) + '...' : lock.message}"
                    </p>
                    <p className="text-xs love-lock-text-muted mt-1">
                      ID: {lock.objectId.slice(0, 8)}...{lock.objectId.slice(-8)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={() => onSelectLock(lock.objectId)}
                      size="sm"
                      variant="outline"
                      className="love-lock-accent hover:bg-pink-200 love-lock-text"
                    >
                      View Details
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleAcceptDecline(lock.objectId, true)}
                        size="sm"
                        disabled={processingLock === lock.objectId}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processingLock === lock.objectId ? (
                          <ClipLoader size={12} color="white" />
                        ) : (
                          "Accept"
                        )}
                      </Button>
                      <Button 
                        onClick={() => handleAcceptDecline(lock.objectId, false)}
                        size="sm"
                        disabled={processingLock === lock.objectId}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {processingLock === lock.objectId ? (
                          <ClipLoader size={12} color="white" />
                        ) : (
                          "Decline"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm love-lock-text-muted">
            <h3 className="font-semibold mb-2 love-lock-text">About Pending Love Locks:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>These are love locks that have been sent to you by others</li>
              <li>You can <strong>Accept</strong> them to lock them forever on the bridge</li>
              <li>You can <strong>Decline</strong> them if you don't want it forever on the blockchain</li>
              <li>Once you respond, the lock will either be permanently locked or destroyed</li>
              <li>Only you (the recipient) can accept or decline these locks</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}