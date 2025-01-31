import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { Routes, Route, useParams } from 'react-router-dom'
import { Auth } from './components/Auth'
import { Dashboard } from './components/Dashboard'
import { ParticipantProfile } from "./components/ParticipantProfile/ParticipantProfile"
import { auth } from './config/firebase'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { OrganizationProvider } from './context/OrganizationContext'
import './App.css'

interface UserData {
    firstName: string;
    lastName: string;
    role: 'developer' | 'admin' | 'staff';
    organizationId?: string;
}

const ParticipantProfileWrapper = () => {
    const { id } = useParams();
    return <ParticipantProfile participantId={id || ''} />;
};

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [user, setUser] = useState<User | null>(null)
    const [userName, setUserName] = useState('')
    const [userRole, setUserRole] = useState<'developer' | 'admin' | 'staff'>('staff')
    const db = getFirestore()

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser)
            setIsLoggedIn(!!currentUser)

            if (currentUser) {
                const userDoc = doc(db, 'users', currentUser.uid)
                const userSnapshot = await getDoc(userDoc)
                if (userSnapshot.exists()) {
                    const userData = userSnapshot.data() as UserData
                    setUserName(`${userData.firstName} ${userData.lastName}`)
                    setUserRole(userData.role)
                }
            }
        })

        return () => unsubscribe()
    }, [db])

    return (
        <div className="App">
            {!isLoggedIn ? (
                <Auth />
            ) : (
                <OrganizationProvider>
                    <Routes>
                        <Route path="/" element={
                            <Dashboard
                                userEmail={user?.email || ''}
                                userName={userName}
                                userRole={userRole}
                                onLogout={() => auth.signOut()}
                            />
                        } />
                        <Route path="/participants/:id" element={<ParticipantProfileWrapper />} />
                    </Routes>
                </OrganizationProvider>
            )}
        </div>
    )
}

export default App
