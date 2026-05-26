// Picks the most recent qualifying photo for each audience slot, or NULL
// if none exists. Caller must place these statements AFTER the triggering
// UPDATE/DELETE in the same D1 batch so the subquery sees the post-write state.
export function reconcileCountryThumbnailStatements(
  db: D1Database,
  countryId: number
) {
  return [
    db.prepare(
      `UPDATE countries
       SET public_thumbnail_photo_id = (
         SELECT id FROM photos
         WHERE country_id = ?1 AND is_public = 1
         ORDER BY created_at DESC, id DESC
         LIMIT 1
       )
       WHERE id = ?1`
    ).bind(countryId),

    db.prepare(
      `UPDATE countries
       SET private_thumbnail_photo_id = (
         SELECT id FROM photos
         WHERE country_id = ?1 AND is_public = 0
         ORDER BY created_at DESC, id DESC
         LIMIT 1
       )
       WHERE id = ?1`
    ).bind(countryId),
  ];
}
