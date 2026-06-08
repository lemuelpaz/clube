export type UserRole = 'MALE' | 'FEMALE' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED'
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type SubscriptionPlan = 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL'
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING_PAYMENT'

export interface SugarProfile {
  lookingFor: string[]
  allowanceRange: string
  meetingFrequency: string
  activities: string[]
  availability: string
  description?: string
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  status: UserStatus
  cpf?: string
  phone?: string
  birthDate?: string
  city?: string
  state?: string
  photos: string[]
  bio?: string
  interests?: string[]
  sugarProfile?: SugarProfile
  verified: boolean
  hidden?: boolean
  balance?: number
  bankDetails?: BankDetails
  lastSeen?: string
  createdAt: string
  updatedAt?: string
}

export interface Verification {
  id: string
  userId: string
  status: VerificationStatus
  documentUrl?: string
  selfieUrl?: string
  notes?: string
  rejectionReason?: string
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
}

export interface Like {
  id: string
  fromUserId: string
  toUserId: string
  createdAt: string
}

export interface Match {
  id: string
  user1Id: string
  user2Id: string
  createdAt: string
}

export interface Message {
  id: string
  matchId: string
  senderId: string
  content: string
  read: boolean
  createdAt: string
  expiresAt: string
}

export interface Subscription {
  id: string
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  startDate: string
  endDate: string
  amount: number
  paymentMethod?: string
  pixChargeId?: string
  pixQrCode?: string
  pixQrCodeText?: string
  createdAt: string
}

export interface BankDetails {
  bankName: string
  agency: string
  account: string
  accountType: 'CHECKING' | 'SAVINGS'
  pixKey?: string
  pixKeyType?: 'CPF' | 'PHONE' | 'EMAIL' | 'EVP'
  holderName: string
  holderCpf: string
}

export interface WithdrawalRequest {
  id: string
  userId: string
  amount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
  bankDetails: BankDetails
  notes?: string
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
}

export interface PaymentConfig {
  provider: 'PIXUP'
  clientId: string
  clientSecret: string
  sandbox: boolean
  updatedAt: string
}

export interface ProfileVisit {
  id: string
  visitorId: string
  visitedId: string
  createdAt: string
}

export interface Report {
  id: string
  reporterId: string
  reportedId: string
  reason: string
  description?: string
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED'
  createdAt: string
}

export interface Block {
  id: string
  blockerId: string
  blockedId: string
  createdAt: string
}

export interface Favorite {
  id: string
  userId: string
  favoriteUserId: string
  createdAt: string
}

export interface HotRequest {
  id: string
  requesterId: string
  targetId: string
  price: number
  message?: string
  status: 'PENDING' | 'ACCEPTED' | 'PHOTO_SENT' | 'PAID' | 'REJECTED'
  photoUrl?: string
  createdAt: string
  respondedAt?: string
  paidAt?: string
}

export interface Earning {
  id: string
  userId: string
  amount: number
  type: 'LIKE_RECEIVED' | 'MATCH' | 'HOT_PHOTO_SOLD' | 'CONTENT_POSTED'
  description: string
  fromUserId?: string
  createdAt: string
}

export interface PlanPrice {
  plan: SubscriptionPlan
  price: number
  label: string
  durationDays: number
}

export interface Promotion {
  id: string
  code: string
  description?: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  maxUses?: number
  uses: number
  validFrom?: string
  validUntil?: string
  active: boolean
  appliesTo: 'ALL' | SubscriptionPlan
  createdAt: string
}

export interface Database {
  users: User[]
  verifications: Verification[]
  likes: Like[]
  matches: Match[]
  messages: Message[]
  subscriptions: Subscription[]
  profileVisits: ProfileVisit[]
  reports: Report[]
  blocks: Block[]
  favorites: Favorite[]
  hotRequests: HotRequest[]
  earnings: Earning[]
  withdrawalRequests: WithdrawalRequest[]
  paymentConfig?: PaymentConfig
}

export interface PublicUser {
  id: string
  name: string
  city?: string
  state?: string
  birthDate?: string
  photos: string[]
  bio?: string
  interests?: string[]
  sugarProfile?: SugarProfile
  verified: boolean
  lastSeen?: string
  role: UserRole
  balance?: number
}
