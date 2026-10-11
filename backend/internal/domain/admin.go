package domain

import "time"

type AdminMetrics struct {
	TotalUsers                    int64 `json:"totalUsers"`
	TotalUMKMUsers                int64 `json:"totalUmkmUsers"`
	TotalMitraUsers               int64 `json:"totalMitraUsers"`
	TotalBusinesses               int64 `json:"totalBusinesses"`
	PublishedBusinesses           int64 `json:"publishedBusinesses"`
	UnverifiedPublishedBusinesses int64 `json:"unverifiedPublishedBusinesses"`
}

type AdminGrowthPoint struct {
	Month time.Time `json:"month"`
	Count int64     `json:"count"`
}

type AdminRecentBusiness struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Category  string    `json:"category"`
	Location  string    `json:"location"`
	CreatedAt time.Time `json:"createdAt"`
	Status    string    `json:"status"`
	Verified  bool      `json:"verified"`
}

type AdminOverview struct {
	Metrics            AdminMetrics          `json:"metrics"`
	RegistrationGrowth []AdminGrowthPoint    `json:"registrationGrowth"`
	RecentBusinesses   []AdminRecentBusiness `json:"recentBusinesses"`
}
