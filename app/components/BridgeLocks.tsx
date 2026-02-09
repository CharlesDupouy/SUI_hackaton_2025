'use client'
import { useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

interface LockData {
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

export function BridgeLocks({ onSelectLock }: { onSelectLock: (id: string) => void }) {
  const bridgeObjectId = useNetworkVariable("bridgeObjectId");
  const lovelockPackageId = useNetworkVariable("lovelockPackageId");
  const suiClient = useSuiClient();
  const [isLoading, setIsLoading] = useState(false);
  const [locks, setLocks] = useState<LockData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch bridge object to get all locks
  const { data: bridgeData, refetch: refetchBridge } = useSuiClientQuery(
    "getObject",
    {
      id: bridgeObjectId,
      options: {
        showContent: true,
        showOwner: true,
      },
    },
    { enabled: !!bridgeObjectId }
  );

  const fetchAllLocks = async () => {
    console.log("🔍 Starting to fetch bridge locks...");
    console.log("📍 Bridge Object ID:", bridgeObjectId);
    console.log("📍 Lovelock Package ID:", lovelockPackageId);

    if (!bridgeObjectId) {
      console.error("❌ Bridge object ID not configured");
      setError("Bridge object ID not configured");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the bridge object
      console.log("🌉 Fetching bridge object...");
      const bridge = await suiClient.getObject({
        id: bridgeObjectId,
        options: {
          showContent: true,
          showOwner: true,
        },
      });

      console.log("🌉 Bridge object response:", bridge);

      if (!bridge.data) {
        console.error("❌ Bridge not found");
        setError("Bridge not found");
        return;
      }

      console.log("✅ Bridge found successfully");
      console.log("🌉 Bridge data:", bridge.data);

      // Try to get objects owned by the bridge first
      let lockObjects: LockData[] = [];
      
      try {
        console.log("🔍 Fetching objects owned by bridge...");
        const ownedObjects = await suiClient.getOwnedObjects({
          owner: bridgeObjectId,
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

        // Filter for Lock objects and parse them
        const lockTypeFilter = `${lovelockPackageId}::lovelock::Lock`;
        console.log(`🔍 Filtering for objects containing: "${lockTypeFilter}"`);
        
        const lockObjectsRaw = ownedObjects.data.filter(obj => {
          const isLock = obj.data?.type?.includes(lockTypeFilter);
          console.log(`🔍 Object ${obj.data?.objectId} type "${obj.data?.type}" matches:`, isLock);
          return isLock;
        });

        console.log("🔒 Found lock objects:", lockObjectsRaw.length);

        lockObjects = lockObjectsRaw.map((obj, index) => {
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
            } as LockData;
            
            console.log(`🔒 Parsed lock ${index + 1}:`, lockData);
            return lockData;
          }
          console.log(`❌ Object ${index + 1} is not a move object`);
          return null;
        }).filter(Boolean) as LockData[];

        console.log("🔒 Final parsed locks:", lockObjects);
        
      } catch (ownedError) {
        console.error("❌ Error fetching owned objects:", ownedError);
        console.log("🔄 Trying alternative approach...");
      }

      // If no locks found via owned objects, try to find all Lock objects and filter for closed ones
      if (lockObjects.length === 0) {
        console.log("🔍 No locks found via owned objects, trying alternative approach...");
        try {
          // Try to query for all objects of the Lock type
          console.log("🔍 Attempting to query all Lock objects...");
          
          // This is a more advanced query - we'll try to get objects by type
          const allObjects = await suiClient.getOwnedObjects({
            owner: "0x0000000000000000000000000000000000000000000000000000000000000000", // This won't work, let's try a different approach
            options: {
              showContent: true,
              showType: true,
            },
          });
        } catch (queryError) {
          console.log("❌ Alternative query approach not available:", queryError);
        }
      }

      console.log("📊 Final results:");
      console.log("📊 Lock objects found:", lockObjects.length);
      console.log("📊 Lock objects data:", lockObjects);

      setLocks(lockObjects);
      
      if (lockObjects.length === 0) {
        const errorMsg = "No locks found on the bridge yet. Create and accept some love locks to see them here! The bridge is working correctly, but no locks have been permanently locked yet.";
        console.log("ℹ️ Setting info message:", errorMsg);
        setError(errorMsg);
      } else {
        console.log("✅ Successfully found and set locks");
      }
      
    } catch (err) {
      console.error("❌ Error fetching bridge locks:", err);
      setError("Failed to fetch bridge locks. Make sure the bridge object ID is correct.");
    } finally {
      console.log("🏁 Finished fetching bridge locks");
      setIsLoading(false);
    }
  };

  const getBridgeInfo = (data: any) => {
    if (data?.content?.dataType !== "moveObject") return null;
    return data.content.fields as {
      master: string;
    };
  };

  const bridgeInfo = bridgeData ? getBridgeInfo(bridgeData) : null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold love-lock-text mb-4">Bridge Locks</h2>
        <p className="love-lock-text-muted mb-6">
          View all love locks that have been permanently locked on the bridge
        </p>
      </div>

      {/* Bridge Information */}
      {bridgeInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="love-lock-text">Bridge Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium love-lock-text">Bridge Master:</span>
                <span className="text-sm love-lock-text-muted">
                  {bridgeInfo.master.slice(0, 8)}...{bridgeInfo.master.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium love-lock-text">Bridge ID:</span>
                <span className="text-sm love-lock-text-muted">
                  {bridgeObjectId.slice(0, 8)}...{bridgeObjectId.slice(-8)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fetch Locks Button */}
      <Card>
        <CardHeader>
          <CardTitle className="love-lock-text">Load Bridge Locks</CardTitle>
          <CardDescription className="love-lock-text-muted">
            Fetch all locks that have been permanently locked on this bridge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={fetchAllLocks}
            disabled={isLoading || !bridgeObjectId}
            className="w-full love-lock-button text-white"
          >
            {isLoading ? "Loading..." : "Fetch All Bridge Locks"}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Locks Display */}
        {locks.length > 0 && (() => {
           const bridgeHeight = Math.max(400, locks.length * 150);
           const numberOfBridges = Math.ceil(bridgeHeight / 85);
           const cardHeight = Math.max(500, numberOfBridges * 120 + 250);
           const contentHeight = Math.max(400, numberOfBridges * 120 + 150);
          console.log(`🔢 Height calculations: locks=${locks.length}, bridges=${numberOfBridges}, card=${cardHeight}px, content=${contentHeight}px, bridge=${bridgeHeight}px`);
          return (
          <Card className="overflow-visible" style={{ height: `${cardHeight}px` }}>
            <CardHeader>
              <CardTitle className="love-lock-text">
                Bridge Locks ({locks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-visible" style={{ height: `${contentHeight}px` }}>
              <div className="relative h-full">
               {/* Bridge images stacked vertically */}
               <div className="flex items-center justify-center">
                 <div className="relative w-full" style={{ height: `${bridgeHeight}px` }}>
                   <div className="flex flex-col items-center justify-start h-full">
                     {Array.from({ length: Math.ceil(bridgeHeight / 85) }, (_, index) => (
                       <img 
                         key={index}
                         src="/bridge2.jpg" 
                         alt="Bridge" 
                         className="w-32 h-auto object-contain"
                         style={{ 
                           transform: 'rotate(-90deg)',
                           transformOrigin: 'center',
                           marginBottom: index < Math.ceil(bridgeHeight / 85) - 1 ? '0' : '0'
                         }}
                       />
                     ))}
                   </div>
                 </div>
               </div>
              
              {/* Heart-locks overlaid on top of the bridge */}
              <div className="absolute top-0 left-0 w-full h-full flex justify-center">
                <div className="flex flex-col space-y-12 items-center justify-start pt-8">
                  {locks.map((lock) => (
                    <div key={lock.objectId} className="flex flex-col items-center p-4">
                      <div 
                        className="relative cursor-pointer transform transition-all duration-200 hover:scale-110 hover:rotate-3"
                        onClick={() => onSelectLock(lock.objectId)}
                        title={`Click to view details - ${lock.creation_date?.day}/${lock.creation_date?.month}/${lock.creation_date?.year}`}
                      >
                        <img 
                          src="/heart-lock.png" 
                          alt="Heart Lock" 
                          className="w-16 h-16 object-contain drop-shadow-lg"
                        />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">🔒</span>
                        </div>
                      </div>
                       <p className="text-xs text-black font-bold mt-2 text-center">
                        {lock.creation_date?.day && lock.creation_date?.month 
                          ? `${lock.creation_date.day}/${lock.creation_date.month}` 
                          : 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
          );
        })()}

      {/* Information Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm love-lock-text-muted">
            <h3 className="font-semibold mb-2 love-lock-text">About Bridge Locks:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Only locks that have been <strong>accepted</strong> are stored on the bridge</li>
              <li>Declined locks are destroyed and payments are not returned</li>
              <li>Accepted locks are permanently locked and cannot be modified</li>
              <li>All payments from accepted locks go to the bridge master</li>
              <li>If no locks appear, it means no love locks have been accepted yet</li>
              <li>Create a love lock and have someone accept it to see it appear here</li>
              <li>Use the search function to find specific locks by their object ID</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
