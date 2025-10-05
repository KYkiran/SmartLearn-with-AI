// frontend/src/pages/Profile.tsx
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { authService } from "@/services/authService";

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const resp = await authService.updateProfile({ name, bio });
    if (resp.success) {
      updateUser(resp.data.user);
      toast.success("Profile updated!");
    } else {
      toast.error(resp.message || "Failed");
    }
    setLoading(false);
  };

  if (!user) return <div className="container py-10">Login to view your profile.</div>;

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="space-y-4">
        <div>
          <Label>Your name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <Label>Bio</Label>
          <Input value={bio} onChange={e => setBio(e.target.value)} />
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
