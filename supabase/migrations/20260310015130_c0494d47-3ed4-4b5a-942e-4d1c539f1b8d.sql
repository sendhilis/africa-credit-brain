
-- Delete all Yambukai Finance data in dependency order
DELETE FROM scorecard_results WHERE application_id IN (SELECT id FROM applications WHERE institution_id = 'da80e9d9-02bf-48f0-beb5-57cb9d148b08');
DELETE FROM document_extractions WHERE institution_id = 'da80e9d9-02bf-48f0-beb5-57cb9d148b08';
DELETE FROM payment_history WHERE institution_id = 'da80e9d9-02bf-48f0-beb5-57cb9d148b08';
DELETE FROM income_history WHERE institution_id = 'da80e9d9-02bf-48f0-beb5-57cb9d148b08';
DELETE FROM applications WHERE institution_id = 'da80e9d9-02bf-48f0-beb5-57cb9d148b08';
DELETE FROM borrowers WHERE institution_id = 'da80e9d9-02bf-48f0-beb5-57cb9d148b08';
DELETE FROM user_roles WHERE institution_id = 'da80e9d9-02bf-48f0-beb5-57cb9d148b08';
DELETE FROM profiles WHERE institution_id = 'da80e9d9-02bf-48f0-beb5-57cb9d148b08';
DELETE FROM institutions WHERE id = 'da80e9d9-02bf-48f0-beb5-57cb9d148b08';
