-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: chatbot_campus
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `contact`
--

DROP TABLE IF EXISTS `contact`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(120) NOT NULL,
  `role` varchar(120) DEFAULT NULL,
  `email` varchar(190) DEFAULT NULL,
  `tel` varchar(40) DEFAULT NULL,
  `service` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact`
--

LOCK TABLES `contact` WRITE;
/*!40000 ALTER TABLE `contact` DISABLE KEYS */;
/*!40000 ALTER TABLE `contact` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversation`
--

DROP TABLE IF EXISTS `conversation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_hach` varchar(64) DEFAULT NULL,
  `canal` varchar(30) DEFAULT 'web',
  `Languge` varchar(5) DEFAULT 'fr',
  `statut` varchar(20) DEFAULT NULL,
  `Utili_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_conv_user` (`Utili_id`),
  KEY `idx_conv_canal` (`canal`),
  KEY `idx_conv_lang` (`Languge`),
  CONSTRAINT `fk_conv_user` FOREIGN KEY (`Utili_id`) REFERENCES `utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversation`
--

LOCK TABLES `conversation` WRITE;
/*!40000 ALTER TABLE `conversation` DISABLE KEYS */;
/*!40000 ALTER TABLE `conversation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faq`
--

DROP TABLE IF EXISTS `faq`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faq` (
  `id` int NOT NULL AUTO_INCREMENT,
  `questions` text NOT NULL,
  `reponses` text NOT NULL,
  `langue` varchar(5) DEFAULT 'fr',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faq`
--

LOCK TABLES `faq` WRITE;
/*!40000 ALTER TABLE `faq` DISABLE KEYS */;
INSERT INTO `faq` VALUES (1,'Quels sont les horaires d\'ouverture de la bibliotheque ?','Du lundi au vendredi : 8h00 - 20h00\nLe samedi : 9h00 - 17h00\nFermee : dimanche et jours feries.','fr'),(2,'Comment obtenir mon certificat de scolarite ?','Pour obtenir votre certificat de scolarite, contactez le service scolarite a l\'adresse : scolarite@esic.fr','fr'),(3,'Quand commencent les examens du semestre 1 ?','Les examens du semestre 1 debuteront la semaine du 19 janvier 2025. Le planning detaille est disponible sur Teams, dans la classe ESIS-2_CPDIA-2_2025-2026.','fr'),(4,'Ou puis-je trouver le planning de mes cours ?','Vous pouvez consulter votre planning directement sur Teams, dans la classe : ESIS-2_CPDIA-2_2025-2026.','fr'),(5,'Quels sont les services proposes par le resto U ?','Le restaurant universitaire propose :\n- Menu complet (entree + plat + dessert) a 3,30 EUR\n- Options vegetariennes tous les jours\n- Paiement possible par carte etudiante\n- Horaires d\'ouverture : 11h30 - 14h00, du lundi au vendredi.','fr'),(6,'Comment faire une demande de stage ou d\'alternance ?','Demandez la convention type au service scolarite : scolarite@esic.fr. Faites-la valider par votre entreprise d\'accueil, puis deposez-la au service scolarite au moins 2 semaines avant le debut du stage.','fr'),(7,'Quelles sont les regles de vie sur le campus ?','Les principales regles sont :\n- Respecter les horaires et salles attribuees.\n- Interdiction de fumer dans les batiments.\n- Respect mutuel entre etudiants et enseignants.\n- Utilisation responsable des ressources numeriques.\nLe reglement interieure complet est disponible en PDF sur Teams.','fr'),(8,'Quelles formations propose l\'ecole ?','L\'ESIC propose plusieurs formations :\nBTS MCO, GPME, SIO (SLAM & SISR), NDRC, SAM, CIEL,\nainsi que des Masters en systemes d\'information, cybersécurité, et data science.','fr');
/*!40000 ALTER TABLE `faq` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int DEFAULT NULL,
  `message_id` int DEFAULT NULL,
  `note` tinyint DEFAULT NULL,
  `commentaire` text,
  PRIMARY KEY (`id`),
  KEY `idx_fb_conv` (`conversation_id`),
  KEY `idx_fb_msg` (`message_id`),
  CONSTRAINT `fk_fb_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_fb_msg` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int NOT NULL,
  `horodatage` datetime DEFAULT CURRENT_TIMESTAMP,
  `emetteur` enum('user','bot') NOT NULL,
  `texte` text NOT NULL,
  `reponse_faq_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_msg_conv` (`conversation_id`),
  KEY `idx_msg_faq` (`reponse_faq_id`),
  KEY `idx_msg_emetteur` (`emetteur`),
  KEY `idx_msg_horo` (`horodatage`),
  CONSTRAINT `fk_msg_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_msg_faq` FOREIGN KEY (`reponse_faq_id`) REFERENCES `faq` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `Nom_service` varchar(160) NOT NULL,
  `Horaires` varchar(255) DEFAULT NULL,
  `Localisation` varchar(255) DEFAULT NULL,
  `Contact_id` int DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `idx_services_contact` (`Contact_id`),
  KEY `idx_services_nom` (`Nom_service`),
  CONSTRAINT `fk_services_contact` FOREIGN KEY (`Contact_id`) REFERENCES `contact` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utilisateurs`
--

DROP TABLE IF EXISTS `utilisateurs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utilisateurs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(120) NOT NULL,
  `prenom` varchar(120) DEFAULT NULL,
  `email` varchar(190) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utilisateurs`
--

LOCK TABLES `utilisateurs` WRITE;
/*!40000 ALTER TABLE `utilisateurs` DISABLE KEYS */;
/*!40000 ALTER TABLE `utilisateurs` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-04 14:29:00
