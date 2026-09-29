package service

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/alfian/lumora/backend/internal/store"
)

// Transactor runs fn inside a single database transaction and hands it a
// repository bound to that transaction. Multi-statement writes (profile plus
// milestones/BMC) go through it so a failure halfway cannot leave a profile
// without its children.
type Transactor interface {
	RunInTx(ctx context.Context, fn func(BusinessRepository) error) error
}

// PoolTxRunner is the production Transactor: it opens a pgx transaction and
// builds the repository over it. The commit only happens when fn returns nil.
type PoolTxRunner struct {
	pool *pgxpool.Pool
}

func NewPoolTxRunner(pool *pgxpool.Pool) *PoolTxRunner {
	return &PoolTxRunner{pool: pool}
}

func (r *PoolTxRunner) RunInTx(ctx context.Context, fn func(BusinessRepository) error) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	// Rollback after a successful commit is a no-op.
	defer func() { _ = tx.Rollback(ctx) }()

	if err := fn(store.New(tx)); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit tx: %w", err)
	}
	return nil
}
