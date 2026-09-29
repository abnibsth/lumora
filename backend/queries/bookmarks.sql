-- Bookmarks hanya menampilkan profil published: draft pemilik sendiri tidak
-- punya tempat di halaman bookmark publik mana pun.
-- name: ListBookmarks :many
SELECT b.*
FROM bookmarks bm
JOIN businesses b ON b.id = bm.business_id
WHERE bm.user_id = sqlc.arg('user_id')
  AND b.status = 'published'
ORDER BY bm.created_at DESC, b.name ASC;

-- Sudah ditandai sekalipun tetap dianggap sukses (idempotent).
-- name: InsertBookmark :exec
INSERT INTO bookmarks (user_id, business_id)
VALUES (sqlc.arg('user_id'), sqlc.arg('business_id'))
ON CONFLICT DO NOTHING;

-- Hapus lewat subquery slug supaya tetap bisa unbookmark profil yang sudah
-- tidak published, dan menghapus yang tidak ada tetap sukses (idempotent).
-- name: DeleteBookmark :exec
DELETE FROM bookmarks
WHERE user_id = sqlc.arg('user_id')
  AND business_id = (SELECT id FROM businesses WHERE slug = sqlc.arg('slug'));
