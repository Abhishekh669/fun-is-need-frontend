import OnboardingPageCompo from '@/components/elements/auth/onboarding-page';
import { getUserInDb } from '@/lib/actions/auth/get-user-in-db';
import { auth } from '@/lib/utils/auth/auth';
import { redirect } from 'next/navigation';
import React from 'react'

async function page() {
    const [session, result] = await Promise.all([
        await auth(),
        await getUserInDb(),
    ])
    if (!session || !session?.user) {
        return redirect("/login")
    }
   
    if (result.success && result.message === "user exists") {
        return redirect("/c/private-chat")
    }
    return (
        <div>
            <OnboardingPageCompo session={session} />
        </div>
    )
}

export default page
