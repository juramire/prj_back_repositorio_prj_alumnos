# ************************************************************
# Sequel Ace SQL dump
# Versión 20095
#
# https://sequel-ace.com/
# https://github.com/Sequel-Ace/Sequel-Ace
#
# Equipo: localhost (MySQL 8.0.43)
# Base de datos: repositorio_fct
# Tiempo de generación: 2026-02-14 23:09:05 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
SET NAMES utf8mb4;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE='NO_AUTO_VALUE_ON_ZERO', SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Volcado de tabla ciclos_formativos
# ------------------------------------------------------------

DROP TABLE IF EXISTS `ciclos_formativos`;

CREATE TABLE `ciclos_formativos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `descripcion` (`descripcion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `ciclos_formativos` WRITE;
/*!40000 ALTER TABLE `ciclos_formativos` DISABLE KEYS */;

INSERT INTO `ciclos_formativos` (`id`, `descripcion`)
VALUES
	(4,'Administración de Sistemas Informáticos en Red'),
	(2,'Desarrollo de Aplicaciones Multiplataforma'),
	(1,'Desarrollo de Aplicaciones Web'),
	(3,'Sistemas Microinformáticos y Redes');

/*!40000 ALTER TABLE `ciclos_formativos` ENABLE KEYS */;
UNLOCK TABLES;


# Volcado de tabla incidencias
# ------------------------------------------------------------

DROP TABLE IF EXISTS `incidencias`;

CREATE TABLE `incidencias` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('ABIERTA','EN_PROGRESO','RESUELTA','DESCARTADA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ABIERTA',
  `contexto` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_incidencias_user` (`user_id`),
  KEY `idx_incidencias_estado` (`estado`),
  CONSTRAINT `fk_incidencias_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `incidencias` WRITE;
/*!40000 ALTER TABLE `incidencias` DISABLE KEYS */;

INSERT INTO `incidencias` (`id`, `user_id`, `email`, `name`, `descripcion`, `estado`, `contexto`, `created_at`)
VALUES
	(1,3,'bruno@example.com','Bruno Estudiante','asfasfdasf','ABIERTA','/proyectos','2026-02-01 00:14:30');

/*!40000 ALTER TABLE `incidencias` ENABLE KEYS */;
UNLOCK TABLES;


# Volcado de tabla proyectos
# ------------------------------------------------------------

DROP TABLE IF EXISTS `proyectos`;

CREATE TABLE `proyectos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `resumen` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ciclo_id` int NOT NULL,
  `curso_academico` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tags` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `alumnos` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('NOT_SEND','SUBMITTED','PUBLISHED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NOT_SEND',
  `video_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pdf_urls` json DEFAULT NULL,
  `last_modified_by` int DEFAULT NULL,
  `last_modified_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_proyectos_user` (`user_id`),
  KEY `idx_title` (`title`),
  KEY `idx_curso` (`curso_academico`),
  KEY `idx_ciclo` (`ciclo_id`),
  KEY `idx_status` (`status`),
  KEY `fk_proyectos_last_modified_by` (`last_modified_by`),
  FULLTEXT KEY `ft_proyectos` (`title`,`descripcion`,`resumen`,`tags`),
  CONSTRAINT `fk_proyectos_ciclo` FOREIGN KEY (`ciclo_id`) REFERENCES `ciclos_formativos` (`id`),
  CONSTRAINT `fk_proyectos_last_modified_by` FOREIGN KEY (`last_modified_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_proyectos_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `proyectos` WRITE;
/*!40000 ALTER TABLE `proyectos` DISABLE KEYS */;

INSERT INTO `proyectos` (`id`, `user_id`, `title`, `descripcion`, `resumen`, `ciclo_id`, `curso_academico`, `tags`, `alumnos`, `status`, `video_url`, `image_url`, `pdf_urls`, `last_modified_by`, `last_modified_at`, `created_at`, `updated_at`, `submitted_at`, `published_at`)
VALUES
	(1,2,'Gestor de Inventario Web33','Aplicación web para gestionar inventario escolar con alertas de stock y exportación.','Inventario online con control de stock y reportes.',1,'2024/25','angular, node, mysql','Ana Alumna, Carlos Teammate','PUBLISHED','http://localhost:3000/uploads/demo-inventario.mp4',NULL,'[\"http://localhost:3000/uploads/inventario-doc.pdf\"]',NULL,NULL,'2026-01-31 00:57:31','2026-02-02 09:43:03','2026-01-31 00:57:31','2026-02-02 09:43:03'),
	(2,3,'App de Citas Médicas','Plataforma para reservar citas y recordar turnos mediante correo/SMS.2','Reserva de citas y recordatorios automáticos.234',2,'2024/25','flutter, api, salud','Bruno Estudiante','PUBLISHED',NULL,NULL,'[]',NULL,NULL,'2026-01-31 00:57:31','2026-02-01 00:17:47','2026-02-01 00:17:22','2026-02-01 00:17:47'),
	(3,2,'Sistema de Gestión de Biblioteca','Backend para préstamo de libros con autenticación y panel admin.','Gestión de biblioteca con roles y métricas.',4,'2023/24','express, rest, biblioteca','Ana Alumna','PUBLISHED',NULL,NULL,NULL,8,'2026-02-02 12:00:04','2026-01-31 00:57:31','2026-02-02 12:00:04',NULL,'2026-02-02 12:00:04'),
	(4,3,'Plataforma de Mentorías','Portal para emparejar estudiantes con mentores, chat y agenda.','Mentorías con matching automático y calendario.',1,'2024/25','react, node, mentoring','Bruno Estudiante, Ana Alumna','PUBLISHED',NULL,NULL,'[\"http://localhost:3000/uploads/mentorias.pdf\"]',8,'2026-02-02 12:33:34','2026-01-31 00:57:31','2026-02-02 12:33:34','2026-02-01 00:43:08','2026-02-02 12:33:34'),
	(5,4,'Dashboard Energético IoT','Visualización de consumo eléctrico en tiempo real usando MQTT.','Panel IoT con alertas y exportación CSV.',3,'2024/25','iot, mqtt, charts','Claudia Dev','PUBLISHED','http://localhost:3000/uploads/iot-demo.mp4',NULL,'[\"http://localhost:3000/uploads/iot-memoria.pdf\"]',NULL,NULL,'2026-01-31 00:57:31','2026-01-31 00:57:31','2026-01-31 00:57:31','2026-01-31 00:57:31'),
	(6,5,'Gestor de Incidencias Escolar','API para registrar incidencias en aulas con flujo de estados.','Issue tracker simple para centros educativos.',2,'2023/24','nestjs, postgres, incidencias','Diego Tester','NOT_SEND',NULL,NULL,'[]',NULL,NULL,'2026-01-31 00:57:31','2026-01-31 00:57:31',NULL,NULL),
	(7,2,'Reservas de Laboratorio','Sistema de reservas de laboratorios con control de aforo y horarios.','Reservas, calendarios y recordatorios.',4,'2024/25','vue, express, reservas','Ana Alumna','PUBLISHED',NULL,NULL,'[\"http://localhost:3000/uploads/labs.pdf\"]',NULL,NULL,'2026-01-31 00:57:31','2026-01-31 00:57:31','2026-01-31 00:57:31','2026-01-31 00:57:31'),
	(8,3,'App de Hábitos Saludables','Seguimiento de hábitos con notificaciones push y retos semanales.','Hábitos, gamificación y ranking.',2,'2024/25','flutter, firebase, health','Bruno Estudiante','SUBMITTED','http://localhost:3000/uploads/habitos.mp4',NULL,'[\"http://localhost:3000/uploads/habitos.pdf\"]',NULL,NULL,'2026-01-31 00:57:31','2026-01-31 00:57:31','2026-01-31 00:57:31',NULL),
	(9,4,'Analítica de Tráfico Web','Recolector de métricas web con panel en tiempo real.','Analítica ligera sin cookies.',1,'2023/24','node, websockets, analytics','Claudia Dev','NOT_SEND',NULL,NULL,NULL,NULL,NULL,'2026-01-31 00:57:31','2026-01-31 00:57:31',NULL,NULL),
	(11,2,'Planificador de Rutas Sostenibles','Cálculo de rutas a pie/bici priorizando zonas verdes.','Rutas ecológicas con mapa interactivo.',1,'2024/25','leaflet, node, sustainability','Ana Alumna','SUBMITTED',NULL,NULL,'[\"http://localhost:3000/uploads/rutas.pdf\"]',NULL,NULL,'2026-01-31 00:57:31','2026-01-31 00:57:31','2026-01-31 00:57:31',NULL),
	(12,3,'Gestor de Turnos para Taller','Aplicación para organizar turnos de taller con control de materiales.','Turnos, inventario y reportes.',3,'2023/24','svelte, api, talleres','Bruno Estudiante, Diego Tester','NOT_SEND',NULL,NULL,'[]',NULL,NULL,'2026-01-31 00:57:31','2026-01-31 00:57:31',NULL,NULL);

/*!40000 ALTER TABLE `proyectos` ENABLE KEYS */;
UNLOCK TABLES;


# Volcado de tabla proyectos_history
# ------------------------------------------------------------

DROP TABLE IF EXISTS `proyectos_history`;

CREATE TABLE `proyectos_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `proyecto_id` bigint NOT NULL,
  `user_id` int DEFAULT NULL,
  `action` enum('CREATE','UPDATE','DELETE','STATUS_CHANGE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `diff` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ph_proyecto` (`proyecto_id`),
  KEY `idx_ph_user` (`user_id`),
  CONSTRAINT `fk_ph_proyecto` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ph_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `proyectos_history` WRITE;
/*!40000 ALTER TABLE `proyectos_history` DISABLE KEYS */;

INSERT INTO `proyectos_history` (`id`, `proyecto_id`, `user_id`, `action`, `diff`, `created_at`)
VALUES
	(1,3,8,'STATUS_CHANGE','{\"status\": {\"after\": \"PUBLISHED\", \"before\": \"DRAFT\"}}','2026-02-02 12:00:03'),
	(2,4,8,'STATUS_CHANGE','{\"status\": {\"after\": \"PUBLISHED\", \"before\": \"SUBMITTED\"}}','2026-02-02 12:33:34');

/*!40000 ALTER TABLE `proyectos_history` ENABLE KEYS */;
UNLOCK TABLES;


# Volcado de tabla users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` enum('user','profesor','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `ciclo_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_ciclo` (`ciclo_id`),
  CONSTRAINT `fk_users_ciclo` FOREIGN KEY (`ciclo_id`) REFERENCES `ciclos_formativos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `rol`, `ciclo_id`, `created_at`, `updated_at`)
VALUES
	(1,'Admin','admin@example.com','$2b$10$kn5FiSryAUhmS8rNJ2SnJ.i2iclJvDS/UoyoxhWP6yE734ZOK43Jq','profesor',4,'2026-01-31 00:57:31','2026-02-14 23:30:19'),
	(2,'Ana Actualizada','ana@example.com','$2a$10$29bfnO6Qy4HshhPwlas8XeZ6OVtWv.aZhlm.JEssKh7UVC80Bjc4G','user',2,'2026-01-31 00:57:31','2026-01-31 10:55:01'),
	(3,'Bruno Estudiante','bruno@example.com','$2a$10$29bfnO6Qy4HshhPwlas8XeZ6OVtWv.aZhlm.JEssKh7UVC80Bjc4G','user',2,'2026-01-31 00:57:31','2026-01-31 00:57:31'),
	(4,'Claudia Dev','claudia@example.com','$2a$10$29bfnO6Qy4HshhPwlas8XeZ6OVtWv.aZhlm.JEssKh7UVC80Bjc4G','user',3,'2026-01-31 00:57:31','2026-01-31 00:57:31'),
	(5,'Diego Tester','diego@example.com','$2a$10$29bfnO6Qy4HshhPwlas8XeZ6OVtWv.aZhlm.JEssKh7UVC80Bjc4G','user',4,'2026-01-31 00:57:31','2026-01-31 00:57:31'),
	(6,'Juan','juan@example.com','$2a$10$EL1oVBFpbxpAGUsJOcxknehQAiT5wn1gFh6PnqKHYNqtWLDmi82NC','user',1,'2026-01-31 01:35:14','2026-02-02 08:17:41'),
	(7,'juan.ramirez46','juramire@gmail.com','$2a$10$SfnQCEdNHo0rQItK079OFOZKQb0WXt2JAbTXItHWBNe/P7vSCft.u','profesor',1,'2026-01-31 01:53:19','2026-02-02 11:38:39'),
	(8,'María2','maria@example.com','$2a$10$29bfnO6Qy4HshhPwlas8XeZ6OVtWv.aZhlm.JEssKh7UVC80Bjc4G','profesor',4,'2026-01-31 01:55:12','2026-02-02 11:51:04'),
	(9,'Nuevo alumno','nuevo@example.com','$2a$10$.TIi9KUdOsO6JIE88hNGVu1a1RGRIXPtjqps2TGYzk/lssCW5Qm/i','user',4,'2026-02-02 08:18:44','2026-02-02 08:18:44');

/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;



/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
