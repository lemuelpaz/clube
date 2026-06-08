import { query, queryOne } from './pool'
import type {
  User, Verification, Like, Match,
  Message, Subscription, ProfileVisit, Report, Block, Favorite,
  HotRequest, Earning, WithdrawalRequest, PaymentConfig,
  PlanPrice, Promotion,
} from '@/types'

// ─── Row mappers ────────────────────────────────────────────────────────────

function rowToUser(r: any): User {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    password: r.password,
    role: r.role,
    status: r.status,
    cpf: r.cpf ?? undefined,
    phone: r.phone ?? undefined,
    birthDate: r.birth_date ?? undefined,
    city: r.city ?? undefined,
    state: r.state ?? undefined,
    photos: r.photos ?? [],
    bio: r.bio ?? undefined,
    interests: r.interests ?? [],
    sugarProfile: r.sugar_profile ?? undefined,
    bankDetails: r.bank_details ?? undefined,
    verified: r.verified,
    balance: Number(r.balance ?? 0),
    lastSeen: r.last_seen ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at ?? undefined,
  }
}

function rowToVerification(r: any): Verification {
  return {
    id: r.id,
    userId: r.user_id,
    status: r.status,
    documentUrl: r.document_url ?? undefined,
    selfieUrl: r.selfie_url ?? undefined,
    notes: r.notes ?? undefined,
    rejectionReason: r.rejection_reason ?? undefined,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at ?? undefined,
    reviewedBy: r.reviewed_by ?? undefined,
  }
}

function rowToLike(r: any): Like {
  return { id: r.id, fromUserId: r.from_user_id, toUserId: r.to_user_id, createdAt: r.created_at }
}

function rowToMatch(r: any): Match {
  return { id: r.id, user1Id: r.user1_id, user2Id: r.user2_id, createdAt: r.created_at }
}

function rowToMessage(r: any): Message {
  return {
    id: r.id, matchId: r.match_id, senderId: r.sender_id,
    content: r.content, read: r.read, createdAt: r.created_at, expiresAt: r.expires_at,
  }
}

function rowToSubscription(r: any): Subscription {
  return {
    id: r.id,
    userId: r.user_id,
    plan: r.plan,
    status: r.status,
    startDate: r.start_date,
    endDate: r.end_date,
    amount: Number(r.amount),
    paymentMethod: r.payment_method ?? undefined,
    pixChargeId: r.pix_charge_id ?? undefined,
    pixQrCode: r.pix_qr_code ?? undefined,
    pixQrCodeText: r.pix_qr_code_text ?? undefined,
    createdAt: r.created_at,
  }
}

function rowToProfileVisit(r: any): ProfileVisit {
  return { id: r.id, visitorId: r.visitor_id, visitedId: r.visited_id, createdAt: r.created_at }
}

function rowToReport(r: any): Report {
  return {
    id: r.id, reporterId: r.reporter_id, reportedId: r.reported_id,
    reason: r.reason, description: r.description ?? undefined,
    status: r.status, createdAt: r.created_at,
  }
}

function rowToBlock(r: any): Block {
  return { id: r.id, blockerId: r.blocker_id, blockedId: r.blocked_id, createdAt: r.created_at }
}

function rowToFavorite(r: any): Favorite {
  return { id: r.id, userId: r.user_id, favoriteUserId: r.favorite_user_id, createdAt: r.created_at }
}

function rowToHotRequest(r: any): HotRequest {
  return {
    id: r.id, requesterId: r.requester_id, targetId: r.target_id,
    price: Number(r.price), message: r.message ?? undefined,
    status: r.status, photoUrl: r.photo_url ?? undefined,
    createdAt: r.created_at, respondedAt: r.responded_at ?? undefined, paidAt: r.paid_at ?? undefined,
  }
}

function rowToEarning(r: any): Earning {
  return {
    id: r.id, userId: r.user_id, amount: Number(r.amount),
    type: r.type, description: r.description,
    fromUserId: r.from_user_id ?? undefined, createdAt: r.created_at,
  }
}

function rowToWithdrawal(r: any): WithdrawalRequest {
  return {
    id: r.id, userId: r.user_id, amount: Number(r.amount),
    status: r.status, bankDetails: r.bank_details,
    notes: r.notes ?? undefined, createdAt: r.created_at,
    reviewedAt: r.reviewed_at ?? undefined, reviewedBy: r.reviewed_by ?? undefined,
  }
}

function rowToPaymentConfig(r: any): PaymentConfig {
  return {
    provider: r.provider, clientId: r.client_id,
    clientSecret: r.client_secret, sandbox: r.sandbox, updatedAt: r.updated_at,
  }
}

function rowToPromotion(r: any): Promotion {
  return {
    id: r.id,
    code: r.code,
    description: r.description ?? undefined,
    discountType: r.discount_type,
    discountValue: Number(r.discount_value),
    maxUses: r.max_uses ?? undefined,
    uses: r.uses,
    validFrom: r.valid_from ?? undefined,
    validUntil: r.valid_until ?? undefined,
    active: r.active,
    appliesTo: r.applies_to,
    createdAt: r.created_at,
  }
}

// ─── Dynamic update helpers ──────────────────────────────────────────────────

const USER_COLS: Record<string, string> = {
  name: 'name', email: 'email', password: 'password', role: 'role',
  status: 'status', cpf: 'cpf', phone: 'phone', birthDate: 'birth_date',
  city: 'city', state: 'state', photos: 'photos', bio: 'bio',
  interests: 'interests', sugarProfile: 'sugar_profile', bankDetails: 'bank_details',
  verified: 'verified', balance: 'balance', lastSeen: 'last_seen',
  updatedAt: 'updated_at',
}

const VERIF_COLS: Record<string, string> = {
  status: 'status', documentUrl: 'document_url', selfieUrl: 'selfie_url',
  notes: 'notes', rejectionReason: 'rejection_reason',
  reviewedAt: 'reviewed_at', reviewedBy: 'reviewed_by',
}

const SUB_COLS: Record<string, string> = {
  plan: 'plan', status: 'status', startDate: 'start_date', endDate: 'end_date',
  amount: 'amount', paymentMethod: 'payment_method',
  pixChargeId: 'pix_charge_id', pixQrCode: 'pix_qr_code', pixQrCodeText: 'pix_qr_code_text',
}

const HOT_COLS: Record<string, string> = {
  status: 'status', photoUrl: 'photo_url',
  respondedAt: 'responded_at', paidAt: 'paid_at',
}

const WITHDRAWAL_COLS: Record<string, string> = {
  status: 'status', notes: 'notes',
  reviewedAt: 'reviewed_at', reviewedBy: 'reviewed_by',
}

async function dynamicUpdate(
  table: string,
  id: string,
  updates: Record<string, unknown>,
  colMap: Record<string, string>,
): Promise<any | null> {
  const entries = Object.entries(updates).filter(([k]) => colMap[k] !== undefined)
  if (!entries.length) return null
  const params: any[] = [id]
  const setClauses = entries.map(([k, v], i) => {
    params.push(v)
    return `${colMap[k]} = $${i + 2}`
  })
  const row = await queryOne(
    `UPDATE ${table} SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    params,
  )
  return row
}

// ─── db object ───────────────────────────────────────────────────────────────

export const db = {
  // ── Users ──────────────────────────────────────────────────────────────────
  getUsers: async (): Promise<User[]> => {
    const rows = await query('SELECT * FROM users ORDER BY created_at DESC')
    return rows.map(rowToUser)
  },

  getUserById: async (id: string): Promise<User | null> => {
    const r = await queryOne('SELECT * FROM users WHERE id = $1', [id])
    return r ? rowToUser(r) : null
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    const r = await queryOne('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email])
    return r ? rowToUser(r) : null
  },

  getUserByCpf: async (cpf: string): Promise<User | null> => {
    const r = await queryOne('SELECT * FROM users WHERE cpf = $1', [cpf])
    return r ? rowToUser(r) : null
  },

  createUser: async (user: User): Promise<User> => {
    await query(
      `INSERT INTO users
        (id,name,email,password,role,status,cpf,phone,birth_date,city,state,
         photos,bio,interests,sugar_profile,bank_details,verified,balance,
         last_seen,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
      [
        user.id, user.name, user.email, user.password, user.role,
        user.status ?? 'ACTIVE', user.cpf ?? null, user.phone ?? null,
        user.birthDate ?? null, user.city ?? null, user.state ?? null,
        user.photos ?? [], user.bio ?? null, user.interests ?? [],
        user.sugarProfile ? JSON.stringify(user.sugarProfile) : null,
        user.bankDetails ? JSON.stringify(user.bankDetails) : null,
        user.verified ?? false, user.balance ?? 0,
        user.lastSeen ?? null, user.createdAt, user.updatedAt ?? null,
      ],
    )
    return user
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User | null> => {
    const upd: Record<string, unknown> = { ...updates, updatedAt: new Date().toISOString() }
    const r = await dynamicUpdate('users', id, upd, USER_COLS)
    return r ? rowToUser(r) : null
  },

  deleteUser: async (id: string): Promise<void> => {
    await query('DELETE FROM users WHERE id = $1', [id])
  },

  // ── Verifications ──────────────────────────────────────────────────────────
  getVerifications: async (): Promise<Verification[]> => {
    const rows = await query('SELECT * FROM verifications ORDER BY created_at DESC')
    return rows.map(rowToVerification)
  },

  getVerificationByUserId: async (userId: string): Promise<Verification | null> => {
    const r = await queryOne(
      'SELECT * FROM verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId],
    )
    return r ? rowToVerification(r) : null
  },

  createVerification: async (v: Verification): Promise<Verification> => {
    await query(
      `INSERT INTO verifications
        (id,user_id,status,document_url,selfie_url,notes,rejection_reason,created_at,reviewed_at,reviewed_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [v.id, v.userId, v.status ?? 'PENDING', v.documentUrl ?? null, v.selfieUrl ?? null,
       v.notes ?? null, v.rejectionReason ?? null, v.createdAt, v.reviewedAt ?? null, v.reviewedBy ?? null],
    )
    return v
  },

  updateVerification: async (id: string, updates: Partial<Verification>): Promise<Verification | null> => {
    const r = await dynamicUpdate('verifications', id, updates as Record<string, unknown>, VERIF_COLS)
    return r ? rowToVerification(r) : null
  },

  // ── Likes ──────────────────────────────────────────────────────────────────
  getLikes: async (): Promise<Like[]> => {
    const rows = await query('SELECT * FROM likes')
    return rows.map(rowToLike)
  },

  getLikesByUser: async (userId: string): Promise<Like[]> => {
    const rows = await query('SELECT * FROM likes WHERE from_user_id = $1', [userId])
    return rows.map(rowToLike)
  },

  getLikesForUser: async (userId: string): Promise<Like[]> => {
    const rows = await query('SELECT * FROM likes WHERE to_user_id = $1', [userId])
    return rows.map(rowToLike)
  },

  hasLiked: async (fromUserId: string, toUserId: string): Promise<boolean> => {
    const r = await queryOne('SELECT 1 FROM likes WHERE from_user_id = $1 AND to_user_id = $2', [fromUserId, toUserId])
    return r !== null
  },

  createLike: async (like: Like): Promise<Like> => {
    await query(
      'INSERT INTO likes (id,from_user_id,to_user_id,created_at) VALUES ($1,$2,$3,$4)',
      [like.id, like.fromUserId, like.toUserId, like.createdAt],
    )
    return like
  },

  deleteLike: async (fromUserId: string, toUserId: string): Promise<void> => {
    await query('DELETE FROM likes WHERE from_user_id = $1 AND to_user_id = $2', [fromUserId, toUserId])
  },

  // ── Matches ────────────────────────────────────────────────────────────────
  getMatches: async (): Promise<Match[]> => {
    const rows = await query('SELECT * FROM matches')
    return rows.map(rowToMatch)
  },

  getMatchesByUser: async (userId: string): Promise<Match[]> => {
    const rows = await query('SELECT * FROM matches WHERE user1_id = $1 OR user2_id = $1', [userId])
    return rows.map(rowToMatch)
  },

  getMatchById: async (id: string): Promise<Match | null> => {
    const r = await queryOne('SELECT * FROM matches WHERE id = $1', [id])
    return r ? rowToMatch(r) : null
  },

  getMatchBetween: async (a: string, b: string): Promise<Match | null> => {
    const r = await queryOne(
      'SELECT * FROM matches WHERE (user1_id=$1 AND user2_id=$2) OR (user1_id=$2 AND user2_id=$1) LIMIT 1',
      [a, b],
    )
    return r ? rowToMatch(r) : null
  },

  createMatch: async (match: Match): Promise<Match> => {
    await query(
      'INSERT INTO matches (id,user1_id,user2_id,created_at) VALUES ($1,$2,$3,$4)',
      [match.id, match.user1Id, match.user2Id, match.createdAt],
    )
    return match
  },

  // ── Messages ───────────────────────────────────────────────────────────────
  getMessages: async (): Promise<Message[]> => {
    const rows = await query('SELECT * FROM messages')
    return rows.map(rowToMessage)
  },

  getMessagesByMatch: async (matchId: string): Promise<Message[]> => {
    const rows = await query(
      'SELECT * FROM messages WHERE match_id = $1 ORDER BY created_at ASC',
      [matchId],
    )
    return rows.map(rowToMessage)
  },

  createMessage: async (msg: Message): Promise<Message> => {
    await query(
      'INSERT INTO messages (id,match_id,sender_id,content,read,created_at,expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [msg.id, msg.matchId, msg.senderId, msg.content, msg.read, msg.createdAt, msg.expiresAt],
    )
    return msg
  },

  markMessagesRead: async (matchId: string, userId: string): Promise<void> => {
    await query(
      'UPDATE messages SET read = TRUE WHERE match_id = $1 AND sender_id != $2 AND read = FALSE',
      [matchId, userId],
    )
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    const r = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM messages m
       JOIN matches mt ON mt.id = m.match_id
       WHERE (mt.user1_id = $1 OR mt.user2_id = $1)
         AND m.sender_id != $1 AND m.read = FALSE`,
      [userId],
    )
    return parseInt(r?.count ?? '0', 10)
  },

  // ── Subscriptions ──────────────────────────────────────────────────────────
  getSubscriptions: async (): Promise<Subscription[]> => {
    const rows = await query('SELECT * FROM subscriptions')
    return rows.map(rowToSubscription)
  },

  getActiveSubscription: async (userId: string): Promise<Subscription | null> => {
    const now = new Date().toISOString()
    const r = await queryOne(
      `SELECT * FROM subscriptions WHERE user_id = $1 AND status = 'ACTIVE' AND end_date > $2 LIMIT 1`,
      [userId, now],
    )
    return r ? rowToSubscription(r) : null
  },

  getUserSubscriptions: async (userId: string): Promise<Subscription[]> => {
    const rows = await query(
      'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId],
    )
    return rows.map(rowToSubscription)
  },

  getSubscriptionByChargeId: async (chargeId: string): Promise<Subscription | null> => {
    const r = await queryOne('SELECT * FROM subscriptions WHERE pix_charge_id = $1 LIMIT 1', [chargeId])
    return r ? rowToSubscription(r) : null
  },

  createSubscription: async (sub: Subscription): Promise<Subscription> => {
    await query(
      `INSERT INTO subscriptions
        (id,user_id,plan,status,start_date,end_date,amount,payment_method,
         pix_charge_id,pix_qr_code,pix_qr_code_text,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        sub.id, sub.userId, sub.plan, sub.status,
        sub.startDate, sub.endDate, sub.amount, sub.paymentMethod ?? null,
        sub.pixChargeId ?? null, sub.pixQrCode ?? null, sub.pixQrCodeText ?? null,
        sub.createdAt,
      ],
    )
    return sub
  },

  updateSubscription: async (id: string, updates: Partial<Subscription>): Promise<Subscription | null> => {
    const r = await dynamicUpdate('subscriptions', id, updates as Record<string, unknown>, SUB_COLS)
    return r ? rowToSubscription(r) : null
  },

  // ── Profile Visits ─────────────────────────────────────────────────────────
  createProfileVisit: async (v: ProfileVisit): Promise<ProfileVisit> => {
    await query(
      'INSERT INTO profile_visits (id,visitor_id,visited_id,created_at) VALUES ($1,$2,$3,$4)',
      [v.id, v.visitorId, v.visitedId, v.createdAt],
    )
    return v
  },

  getVisitorsByUser: async (userId: string): Promise<ProfileVisit[]> => {
    const rows = await query('SELECT * FROM profile_visits WHERE visited_id = $1', [userId])
    return rows.map(rowToProfileVisit)
  },

  // ── Reports ────────────────────────────────────────────────────────────────
  createReport: async (r: Report): Promise<Report> => {
    await query(
      'INSERT INTO reports (id,reporter_id,reported_id,reason,description,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [r.id, r.reporterId, r.reportedId, r.reason, r.description ?? null, r.status ?? 'PENDING', r.createdAt],
    )
    return r
  },

  getReports: async (): Promise<Report[]> => {
    const rows = await query('SELECT * FROM reports')
    return rows.map(rowToReport)
  },

  // ── Blocks ─────────────────────────────────────────────────────────────────
  createBlock: async (b: Block): Promise<Block> => {
    await query(
      'INSERT INTO blocks (id,blocker_id,blocked_id,created_at) VALUES ($1,$2,$3,$4)',
      [b.id, b.blockerId, b.blockedId, b.createdAt],
    )
    return b
  },

  isBlocked: async (blockerId: string, blockedId: string): Promise<boolean> => {
    const r = await queryOne('SELECT 1 FROM blocks WHERE blocker_id = $1 AND blocked_id = $2', [blockerId, blockedId])
    return r !== null
  },

  getBlockedIds: async (userId: string): Promise<string[]> => {
    const rows = await query<{ blocked_id: string }>('SELECT blocked_id FROM blocks WHERE blocker_id = $1', [userId])
    return rows.map(r => r.blocked_id)
  },

  // ── Favorites ──────────────────────────────────────────────────────────────
  getFavorites: async (userId: string): Promise<Favorite[]> => {
    const rows = await query('SELECT * FROM favorites WHERE user_id = $1', [userId])
    return rows.map(rowToFavorite)
  },

  isFavorite: async (userId: string, favId: string): Promise<boolean> => {
    const r = await queryOne('SELECT 1 FROM favorites WHERE user_id = $1 AND favorite_user_id = $2', [userId, favId])
    return r !== null
  },

  createFavorite: async (f: Favorite): Promise<Favorite> => {
    await query(
      'INSERT INTO favorites (id,user_id,favorite_user_id,created_at) VALUES ($1,$2,$3,$4)',
      [f.id, f.userId, f.favoriteUserId, f.createdAt],
    )
    return f
  },

  deleteFavorite: async (userId: string, favId: string): Promise<void> => {
    await query('DELETE FROM favorites WHERE user_id = $1 AND favorite_user_id = $2', [userId, favId])
  },

  // ── Hot Requests ───────────────────────────────────────────────────────────
  getHotRequests: async (): Promise<HotRequest[]> => {
    const rows = await query('SELECT * FROM hot_requests')
    return rows.map(rowToHotRequest)
  },

  getHotRequestsByRequester: async (userId: string): Promise<HotRequest[]> => {
    const rows = await query('SELECT * FROM hot_requests WHERE requester_id = $1', [userId])
    return rows.map(rowToHotRequest)
  },

  getHotRequestsByTarget: async (userId: string): Promise<HotRequest[]> => {
    const rows = await query('SELECT * FROM hot_requests WHERE target_id = $1', [userId])
    return rows.map(rowToHotRequest)
  },

  getHotRequestById: async (id: string): Promise<HotRequest | null> => {
    const r = await queryOne('SELECT * FROM hot_requests WHERE id = $1', [id])
    return r ? rowToHotRequest(r) : null
  },

  createHotRequest: async (r: HotRequest): Promise<HotRequest> => {
    await query(
      `INSERT INTO hot_requests
        (id,requester_id,target_id,price,message,status,photo_url,created_at,responded_at,paid_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [r.id, r.requesterId, r.targetId, r.price, r.message ?? null,
       r.status ?? 'PENDING', r.photoUrl ?? null, r.createdAt, r.respondedAt ?? null, r.paidAt ?? null],
    )
    return r
  },

  updateHotRequest: async (id: string, updates: Partial<HotRequest>): Promise<HotRequest | null> => {
    const r = await dynamicUpdate('hot_requests', id, updates as Record<string, unknown>, HOT_COLS)
    return r ? rowToHotRequest(r) : null
  },

  // ── Earnings ───────────────────────────────────────────────────────────────
  getEarningsByUser: async (userId: string): Promise<Earning[]> => {
    const rows = await query('SELECT * FROM earnings WHERE user_id = $1 ORDER BY created_at DESC', [userId])
    return rows.map(rowToEarning)
  },

  createEarning: async (e: Earning): Promise<Earning> => {
    await query(
      'INSERT INTO earnings (id,user_id,amount,type,description,from_user_id,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [e.id, e.userId, e.amount, e.type, e.description, e.fromUserId ?? null, e.createdAt],
    )
    return e
  },

  getTotalEarnings: async (userId: string): Promise<number> => {
    const r = await queryOne<{ total: string }>(
      'SELECT COALESCE(SUM(amount),0) as total FROM earnings WHERE user_id = $1',
      [userId],
    )
    return Number(r?.total ?? 0)
  },

  // ── Withdrawals ────────────────────────────────────────────────────────────
  getWithdrawals: async (): Promise<WithdrawalRequest[]> => {
    const rows = await query('SELECT * FROM withdrawal_requests ORDER BY created_at DESC')
    return rows.map(rowToWithdrawal)
  },

  getWithdrawalsByUser: async (userId: string): Promise<WithdrawalRequest[]> => {
    const rows = await query('SELECT * FROM withdrawal_requests WHERE user_id = $1 ORDER BY created_at DESC', [userId])
    return rows.map(rowToWithdrawal)
  },

  getWithdrawalById: async (id: string): Promise<WithdrawalRequest | null> => {
    const r = await queryOne('SELECT * FROM withdrawal_requests WHERE id = $1', [id])
    return r ? rowToWithdrawal(r) : null
  },

  createWithdrawal: async (w: WithdrawalRequest): Promise<WithdrawalRequest> => {
    await query(
      `INSERT INTO withdrawal_requests
        (id,user_id,amount,status,bank_details,notes,created_at,reviewed_at,reviewed_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        w.id, w.userId, w.amount, w.status ?? 'PENDING',
        JSON.stringify(w.bankDetails), w.notes ?? null,
        w.createdAt, w.reviewedAt ?? null, w.reviewedBy ?? null,
      ],
    )
    return w
  },

  updateWithdrawal: async (id: string, updates: Partial<WithdrawalRequest>): Promise<WithdrawalRequest | null> => {
    const r = await dynamicUpdate('withdrawal_requests', id, updates as Record<string, unknown>, WITHDRAWAL_COLS)
    return r ? rowToWithdrawal(r) : null
  },

  // ── Payment Config ─────────────────────────────────────────────────────────
  getPaymentConfig: async (): Promise<PaymentConfig | null> => {
    const r = await queryOne("SELECT * FROM payment_config WHERE id = 'singleton'")
    return r ? rowToPaymentConfig(r) : null
  },

  savePaymentConfig: async (cfg: PaymentConfig): Promise<PaymentConfig> => {
    await query(
      `INSERT INTO payment_config (id,provider,client_id,client_secret,sandbox,updated_at)
       VALUES ('singleton',$1,$2,$3,$4,$5)
       ON CONFLICT (id) DO UPDATE SET
         provider = EXCLUDED.provider,
         client_id = EXCLUDED.client_id,
         client_secret = EXCLUDED.client_secret,
         sandbox = EXCLUDED.sandbox,
         updated_at = EXCLUDED.updated_at`,
      [cfg.provider, cfg.clientId, cfg.clientSecret, cfg.sandbox, cfg.updatedAt],
    )
    return cfg
  },

  // ── Plan Prices ────────────────────────────────────────────────────────────
  getPlanPrices: async (): Promise<PlanPrice[]> => {
    const rows = await query('SELECT * FROM plan_prices ORDER BY duration_days ASC')
    return rows.map(r => ({
      plan: r.plan as PlanPrice['plan'],
      price: Number(r.price),
      label: r.label,
      durationDays: r.duration_days,
    }))
  },

  getPlanPrice: async (plan: string): Promise<number> => {
    const r = await queryOne<{ price: string }>('SELECT price FROM plan_prices WHERE plan = $1', [plan])
    const fallback: Record<string, number> = { MONTHLY: 149.90, QUARTERLY: 399.90, SEMIANNUAL: 699.90, ANNUAL: 1199.90 }
    return r ? Number(r.price) : (fallback[plan] ?? 0)
  },

  updatePlanPrice: async (plan: string, price: number): Promise<void> => {
    await query('UPDATE plan_prices SET price = $1 WHERE plan = $2', [price, plan])
  },

  // ── Promotions ─────────────────────────────────────────────────────────────
  getPromotions: async (): Promise<Promotion[]> => {
    const rows = await query('SELECT * FROM promotions ORDER BY created_at DESC')
    return rows.map(rowToPromotion)
  },

  getPromotionById: async (id: string): Promise<Promotion | null> => {
    const r = await queryOne('SELECT * FROM promotions WHERE id = $1', [id])
    return r ? rowToPromotion(r) : null
  },

  getPromotionByCode: async (code: string): Promise<Promotion | null> => {
    const r = await queryOne('SELECT * FROM promotions WHERE UPPER(code) = UPPER($1)', [code])
    return r ? rowToPromotion(r) : null
  },

  createPromotion: async (p: Promotion): Promise<Promotion> => {
    await query(
      `INSERT INTO promotions
        (id,code,description,discount_type,discount_value,max_uses,uses,valid_from,valid_until,active,applies_to,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        p.id, p.code.toUpperCase(), p.description ?? null,
        p.discountType, p.discountValue,
        p.maxUses ?? null, p.uses ?? 0,
        p.validFrom ?? null, p.validUntil ?? null,
        p.active ?? true, p.appliesTo ?? 'ALL', p.createdAt,
      ],
    )
    return p
  },

  updatePromotion: async (id: string, updates: Partial<Promotion>): Promise<Promotion | null> => {
    const PROMO_COLS: Record<string, string> = {
      active: 'active', description: 'description',
      discountType: 'discount_type', discountValue: 'discount_value',
      maxUses: 'max_uses', validFrom: 'valid_from', validUntil: 'valid_until',
      appliesTo: 'applies_to',
    }
    const r = await dynamicUpdate('promotions', id, updates as Record<string, unknown>, PROMO_COLS)
    return r ? rowToPromotion(r) : null
  },

  deletePromotion: async (id: string): Promise<void> => {
    await query('DELETE FROM promotions WHERE id = $1', [id])
  },

  incrementPromotionUses: async (id: string): Promise<void> => {
    await query('UPDATE promotions SET uses = uses + 1 WHERE id = $1', [id])
  },
}
